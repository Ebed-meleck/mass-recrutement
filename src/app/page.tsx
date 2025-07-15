'use client';

import { useState } from "react";
import { useCandidates } from "@/hooks/useCandidates";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DashboardCharts } from "@/features/candidates/DashboardCharts";
import { CandidatesTable } from "@/features/candidates/CandidatesTable";
import { ImportData } from "@/features/candidates/ImportData";
import { AdvancedStats } from "@/features/candidates/AdvancedStats";
// import { Candidate } from "@/types/candidate";
import { useThresholdHistoryStore } from "@/context/thresholdHistoryStore";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { getFromTest } from "@/service/odk.service";
import { useQuery } from "@tanstack/react-query";
import { Candidate } from "@/types/candidate";
import { Loader } from "@/components/ui/loader";

export default function DashboardPage() {
  const { uniqueCandidates = [], error } = useCandidates();
  // const [importedCandidates, setImportedCandidates] = useState<Candidate[] | null>(null);
  // // const candidates = importedCandidates || uniqueCandidates;
  const [threshold, setThreshold] = useState(50);
  const { addThreshold } = useThresholdHistoryStore();

  const fetchData = async () => {
    const response = await getFromTest();
    return response;
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["candidate",],
    queryFn: fetchData,
  });
  const candidates = (data || uniqueCandidates) as Candidate[];

  const handleThresholdChange = (val: number) => {
    setThreshold(val);
    addThreshold(val);
  };

  return (
    <main className="min-h-screen w-full bg-background text-foreground px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <h1 className="text-4xl font-extrabold tracking-tight">Dashboard Recrutement</h1>
        <Button variant="default" onClick={async () => {
          const doc = new jsPDF({ orientation: "landscape" });
          doc.text("Rapport de Recrutement", 14, 14);
          // Stats principales
          doc.text(`Candidats: ${candidates?.length}`, 14, 24);
          doc.text(`Admis: ${candidates?.filter(c => c.total_score >= threshold).length}`, 14, 32);
          doc.text(`Seuil: ${threshold}`, 14, 40);
          // Table
          const tableData = candidates?.map((c) => [
            `${c.fiche_id.nom} ${c.fiche_id.post_nom} ${c.fiche_id.prenom}`,
            c.total_score,
            c.total_score >= threshold ? "Admis" : "Refusé",
          ]);
          autoTable(doc, {
            head: [["Nom complet", "Score", "Statut"]],
            body: tableData,
            startY: 48,
          });
          // Graphiques (capture de la div charts)
          const chartDiv = document.querySelector("#dashboard-charts");
          if (chartDiv) {
            const canvas = await html2canvas(chartDiv as HTMLElement);
            const imgData = canvas.toDataURL("image/png");
            doc.addPage();
            doc.addImage(imgData, "PNG", 10, 10, 270, 80);
          }
          doc.save("rapport_recrutement.pdf");
        }}>
          Rapport PDF
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        <div className="col-span-1 md:col-span-2 xl:col-span-3">
          <ImportData refresh={() => refetch()} loading={isLoading} />
        </div>
        <div className="col-span-1 md:col-span-2 xl:col-span-3">
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <div className="flex flex-wrap gap-4 items-center mb-4">
            <label htmlFor="threshold" className="font-medium">Seuil d&apos;admission :</label>
            <Input
              id="threshold"
              type="number"
              min={0}
              max={100}
              value={threshold}
              onChange={(e) => handleThresholdChange(Number(e.target.value))}
              className="w-24"
            />
            {/* {history.length > 1 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="font-semibold">Historique :</span>
                {history.map((h, idx) => (
                  <Button key={idx} size="sm" variant={idx === history.length - 1 ? "default" : "outline"} disabled={idx === history.length - 1} onClick={() => { setThreshold(h.value); revertTo(idx); }}>
                    {h.value}
                  </Button>
                ))}
              </div>
            )} */}
          </div>
        </div>
      </div>
      {isLoading && (
        <div className="justify-center items-center flex">
          <Loader />
        </div>
      )}
      {candidates && !isLoading && (
        <>
          <DashboardCharts candidates={candidates} threshold={threshold} />
          <div className="mt-3">
            <AdvancedStats candidates={candidates} threshold={threshold} />
          </div>
  
          <Card className="p-6 mb-8 shadow-lg">
            <div className="font-bold text-lg mb-4">Tableau des candidats</div>
            <CandidatesTable candidates={candidates} threshold={threshold} />
          </Card>
        </>
      )}
    </main>
  );
}
