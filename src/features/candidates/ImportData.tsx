// import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
// import { useQuery } from "@tanstack/react-query";
// import { Input } from "@/components/ui/input";
// import { parseCSV } from "@/utils/csv";
// import { Candidate } from "@/types/candidate";
// import { toast } from "sonner";
// import { getFromTest } from "@/service/odk.service";

interface ImportDataProps {
  refresh: () => void;
  loading: boolean;
}

export function ImportData({ refresh, loading }: ImportDataProps) {
  // const fileInputRef = useRef<HTMLInputElement>(null);
  // const [loading, setLoading] = useState(false);

  // Drag & drop handler multi-fichiers
  // const handleFiles = async (files: FileList) => {
  //   setLoading(true);
  //   try {
  //     let allCandidates: Candidate[] = [];
  //     for (let i = 0; i < files.length; i++) {
  //       const text = await files[i].text();
  //       const candidates = parseCSV(text);
  //       allCandidates = allCandidates.concat(candidates);
  //     }
  //     if (allCandidates.length === 0) throw new Error("Aucune donnée valide trouvée");
  //     onDataLoaded(allCandidates);
  //     toast.success(`Import de ${files.length} fichier(s) réussi`);
  //   } catch (e: unknown) {
  //     const message = e instanceof Error ? e.message : String(e);
  //     toast.error("Erreur import : " + message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Lecture locale (reload du CSV du projet)
  // const handleReload = async () => {
  //   setLoading(true);
  //   try {
  //     const res = await fetch("/fm_gc7_eq_form_test_sup_independant.csv");
  //     const text = await res.text();
  //     const candidates = parseCSV(text);
  //     if (candidates.length === 0) throw new Error("Aucune donnée valide trouvée");
  //     onDataLoaded(candidates);
  //     toast.success("Lecture locale réussie");
  //   } catch (e: unknown) {
  //     console.log(e);
  //     const message = e instanceof Error ? e.message : String(e);
  //     toast.error("Erreur lecture locale : " + message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  // Placeholder API
  // const handleApi = () => {
  //   setLoading(true);
  //   getFromTest()
  //     .then((res) => {
  //       onDataLoaded(res);
  //       toast.info("Donnée Récupérer avec success");
  //     }).catch((e) => {
  //       const message = e instanceof Error ? e.message : String(e);
  //       toast.error("Erreur lecture locale : " + message);
  //     }).finally(() => {
  //       setLoading(false);
  //     });
  // };

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
      {/* <Input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        multiple
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
          }
        }}
        className="max-w-xs"
        disabled={loading}
      />
      <Button onClick={handleReload} disabled={loading} variant="outline">
        Recharger le CSV local
      </Button> */}
      <Button onClick={() => refresh()} disabled={loading} variant="outline">
        Actualiser les informations
      </Button>
      {loading && <span className="text-muted-foreground ml-2">Chargement...</span>}
    </div>
  );
} 