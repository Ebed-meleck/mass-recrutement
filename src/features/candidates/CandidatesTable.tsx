/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  getPaginationRowModel,
  ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useFavoritesStore } from "@/context/favoritesStore";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Candidate } from "@/types/candidate";
import ExcelExportService from '@/service/excel.service';

interface CandidatesTableProps {
  candidates: Candidate[];
  threshold: number;
}

export function CandidatesTable({ candidates, threshold }: CandidatesTableProps) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [showOnlyFavorites, setShowOnlyFavorites] = React.useState(false);
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const [minPourcentage, setMinPourcentage] = React.useState(0);
  const [pourcentageSort, setPourcentageSort] = React.useState<'asc' | 'desc' | null>(null);
  const [admissionFilter, setAdmissionFilter] = React.useState<'all' | 'admis' | 'refuses'>('all');
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 100,
  });
  // Colonnes dynamiques (fiche_id-)
  const ficheKeys = useMemo(() => {
    const c = candidates[0];
    return c ? Object.keys(c).filter((k) => k.startsWith("fiche_id")) : [];
  }, [candidates]);

  const scoreKeys = useMemo(() => {
    const c = candidates[0];
    return c ? Object.keys(c).filter((k) => k.startsWith("score_")) : [];
  }, [candidates]);

  const getPct = (c: Candidate) => {
    const pourcentage = c.pourcentage
    if (!pourcentage) return 0;
    return Number(pourcentage);
  };

  const columns = useMemo<ColumnDef<Candidate, unknown>[]>(() => [
    {
      accessorKey: "nom",
      header: "Nom",
      cell: ({ row }) => <span className="font-medium">{row.original.fiche_id.nom || "-"}</span>,
      size: 120,
    },
    {
      accessorKey: "post_nom",
      header: "Post-nom",
      cell: ({ row }) => row.original.fiche_id.post_nom || "-",
      size: 120,
    },
    {
      accessorKey: "prenom",
      header: "Prénom",
      cell: ({ row }) => row.original.fiche_id.prenom || "-",
      size: 120,
    },
    {
      accessorKey: "total_score",
      header: "Score",
      cell: (info: any) => info.getValue() ?? "-",
      size: 80,
    },
    {
      id: "pourcentage_reussite_partielle",
      header: () => (
        <div className="flex items-center gap-1 cursor-pointer select-none" onClick={() => setPourcentageSort(pourcentageSort === 'asc' ? 'desc' : 'asc')}>
          %
          {pourcentageSort === 'asc' && <span title="Tri croissant">▲</span>}
          {pourcentageSort === 'desc' && <span title="Tri décroissant">▼</span>}
        </div>
      ),
      cell: ({ row }: { row: any }) => {
        const { pourcentage } = row.original;
        if (pourcentage === null || pourcentage === "0") return <span className="text-muted-foreground">-</span>;
        const pct = Number(pourcentage);
        let color = "text-muted-foreground";
        if (pct >= threshold) color = "text-green-600 font-bold";
        else if (pct >= threshold - 20) color = "text-yellow-600 font-semibold";
        else if (pct >= threshold - 30) color = "text-red-600 font-semibold";
        return <span className={color}>{pct.toFixed(1)}%</span>;
      },
      size: 100,
    },
    {
      id: "statut",
      header: "Statut",
      cell: ({ row }: { row: any }) => {
        const scores = scoreKeys
          .map((k) => Number(row.original[k]))
          .filter((v) => !isNaN(v));
        // const total = scores.reduce((sum, v) => sum + v, 0);
        const nbQuestions = scores.length;
        if (nbQuestions === 0) return <Badge variant="destructive">Echoué</Badge>;
        const { pourcentage } = row.original;
        const pct = pourcentage ? Number(pourcentage) : 0; 
        const admitted = pct >= threshold;
        return (
          <Badge variant={admitted ? "default" : "destructive"}>
            {admitted ? "Reussie" : "Echoué"}
          </Badge>
        );
      },
      size: 90,
    },
    // ...ficheKeys.map((k) => ({
    //   accessorKey: k,
    //   header: () => (
    //     <span title={k} className="truncate block max-w-[120px] text-xs text-muted-foreground">
    //       {k.replace("fiche_id-", "").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
    //     </span>
    //   ),
    //   cell: (info: any) => (
    //     <span className="truncate block max-w-[120px] text-xs" title={info.getValue() || "-"}>
    //       {info.getValue() || "-"}
    //     </span>
    //   ),
    //   size: 120,
    // })),
  ], [ficheKeys, scoreKeys, threshold, isFavorite, toggleFavorite, pourcentageSort]);

  // Filtrage favoris + filtre pourcentage + filtre admission
  const filteredCandidates = useMemo(() => {
    let data = candidates;
    if (globalFilter) {
      data = data.filter((c) =>
        `${c.fiche_id.nom} ${c.fiche_id.post_nom} ${c.fiche_id.prenom}`.toLowerCase().includes(globalFilter.toLowerCase())
      );
    }
    // Filtre par pourcentage
    data = data.filter((c) => {
      if (!c.pourcentage) return false;
      const pct = c.pourcentage ? Number(c.pourcentage) : 0;
      return pct >= minPourcentage;
    });
    // Filtre par statut d'admission
    if (admissionFilter !== 'all') {
      data = data.filter((c) => {
        if (!c.pourcentage) return false;
        const pct = Number(c.pourcentage);
        if (admissionFilter === 'admis') return pct >= threshold;
        if (admissionFilter === 'refuses') return pct < threshold;
        return true;
      });
    }
    // Tri par pourcentage si activé
    if (pourcentageSort) {
      data = [...data].sort((a, b) => {
        return pourcentageSort === 'asc' ? getPct(a) - getPct(b) : getPct(b) - getPct(a);
      });
    }
    return data;
  }, [candidates, showOnlyFavorites, isFavorite, globalFilter, minPourcentage, pourcentageSort, scoreKeys, admissionFilter, threshold]);

  // Table instance
  const table = useReactTable({
    data: filteredCandidates,
    columns,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // onGlobalFilterChange: setGlobalFilter,
    state: {
      pagination
      
    },
    columnResizeMode: 'onChange',
  });

  // Export CSV
  const handleExportCSV = () => {
    const data = filteredCandidates.map((c) => {
      return {
        nom: c.fiche_id.nom,
        post_nom: c.fiche_id.post_nom,
        prenom: c.fiche_id.prenom,
        total_score: c.total_score,
        pourcentage: c.pourcentage,
        statut: getPct(c) >= threshold ? "Admis" : "Refusé",
      };
    });
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "candidats.csv");
  };

  const handleExportExcel = () => {
    const data = filteredCandidates.map((c) => {
      const fullname =  `${c.fiche_id.nom} ${c.fiche_id.post_nom} ${c.fiche_id.prenom}`
      return {
        nom: c.fiche_id.nom,
        post_nom: c.fiche_id.post_nom,
        prenom: c.fiche_id.prenom,
        fullname,
        total_score: c.total_score,
        pourcentage: c.pourcentage,
        statut: getPct(c) >= threshold ? "Admis" : "Refusé",
      };
    });
    ExcelExportService(data, 'resultat_test_si'); 
  }

  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const tableData = filteredCandidates.map((c) => [
      `${c.fiche_id.nom} ${c.fiche_id.post_nom} ${c.fiche_id.prenom}`,
      c.total_score,
      c.pourcentage,
      getPct(c) >= threshold ? "Admis" : "Refusé",
    ]);
    autoTable(doc, {
      head: [["Nom complet", "Score", "Pourcentage", "Statut"]],
      body: tableData,
    });
    doc.save("candidats.pdf");
  };

  return (
    <div className="w-full overflow-x-auto rounded-lg border bg-background shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4 px-2 pt-2">
        <Input
          placeholder="Recherche candidat..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2 items-center">
          <span className="text-xs">% min :</span>
          <Input
            type="number"
            min={0}
            max={100}
            value={minPourcentage}
            onChange={e => setMinPourcentage(Number(e.target.value))}
            className="w-16 px-1 py-1 text-xs"
          />
          <span className="text-xs">Statut :</span>
          <select
            value={admissionFilter}
            onChange={e => setAdmissionFilter(e.target.value as 'all' | 'admis' | 'refuses')}
            className="text-xs border rounded px-1 py-1 bg-background"
          >
            <option value="all">Tous</option>
            <option value="admis">Admis</option>
            <option value="refuses">Refusés</option>
          </select>
          {/* <Switch checked={showOnlyFavorites} onCheckedChange={setShowOnlyFavorites} /> */}
          <span className="text-sm">Favoris uniquement</span>
          <Button variant="outline" onClick={handleExportCSV}>Exporter CSV</Button>
          <Button variant="outline" onClick={handleExportExcel}>Exporter Excel</Button>
          <Button variant="outline" onClick={handleExportPDF}>Exporter PDF</Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: any) => (
              <TableRow key={headerGroup.id} className="sticky top-0 z-10 bg-background">
                {headerGroup.headers.map((header: any) => (
                  <TableHead key={header.id} className="bg-muted/50 text-xs font-bold whitespace-nowrap px-2 py-3">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row: any) => {
                // Calcul du pourcentage de réussite partielle pour la ligne
                // const scores = scoreKeys
                //   .map((k) => Number(row.original[k]))
                //   .filter((v) => !isNaN(v));
                // const total = scores.reduce((sum, v) => sum + v, 0);
                // const nbQuestions = scores.length;
                const pct = getPct(row.original);
                let bg = "";
                if (pct !== null) {
                  if (pct >= threshold) bg = "bg-green-50 dark:bg-green-900/20";
                  else if (pct >= threshold - 20) bg = "bg-yellow-50 dark:bg-yellow-900/20";
                  else if (pct >= threshold - 30) bg = "bg-red-50 dark:bg-red-900/20";
                  else bg = "bg-muted/30 dark:bg-muted/10";
                } else {
                  bg = "bg-muted/30 dark:bg-muted/10";
                }
                return (
                  <TableRow key={row.id} className={bg}>
                    {row.getVisibleCells().map((cell: any) => (
                      <TableCell key={cell.id} className="px-2 py-2 text-xs whitespace-nowrap max-w-[120px] overflow-hidden text-ellipsis">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">Aucun candidat trouvé</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-between items-center mt-4 px-2 pb-2">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
            Précédent
          </Button>
          <Button variant="outline" size="sm" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
} 