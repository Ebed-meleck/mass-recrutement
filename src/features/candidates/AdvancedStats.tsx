/* eslint-disable @typescript-eslint/no-unused-vars */
import { Card } from "@/components/ui/card";
import { Candidate } from "@/types/candidate";
import { mean, min, max, quartiles } from "./statistics";
import { CheckCircleIcon, XCircleIcon, UsersIcon, ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline";

interface AdvancedStatsProps {
  candidates: Candidate[];
  threshold: number;
}

export function AdvancedStats({ candidates, threshold }: AdvancedStatsProps) {
  if (!candidates.length) return null;
  const scores = candidates.map((c) => Number(c.total_score)).sort((a, b) => a - b);
  // Calcul admis/refusés et taux de réussite basés sur le pourcentage de réussite partielle
  const scoreKeys = candidates[0] ? Object.keys(candidates[0]).filter((k) => k.startsWith("score_")) : [];
  const getPct = (c: Candidate) => {
    const pourcentage = c.pourcentage
    if (!pourcentage) return 0;
    return Number(pourcentage);
  };
  const admitted = candidates.filter((c) => getPct(c) >= threshold);
  const refused = candidates.filter((c) => getPct(c) < threshold);
  const successRate = ((admitted.length / candidates.length) * 100).toFixed(1);
  const avgPct = candidates.length ? (candidates.reduce((sum, c) => sum + getPct(c), 0) / candidates.length).toFixed(1) : '-';
  const q = quartiles(scores);

  // Stat par sexe
  const sexeCounts: Record<string, number> = {};
  for (const c of candidates) {
    const sexe = (c.fiche_id.sexe || "-").toString().trim();
    sexeCounts[sexe] = (sexeCounts[sexe] || 0) + 1;
  }

  const stats = [
    {
      label: "Score min.",
      value: scores.length ? min(scores) : "-",
      icon: ArrowDownIcon,
      color: "text-blue-600",
      description: "Score le plus bas obtenu."
    },
    {
      label: "Moyenne",
      value: isNaN(mean(scores)) ? "-" : mean(scores).toFixed(2),
      icon: UsersIcon,
      color: "text-emerald-600",
      description: "Score moyen obtenu par l’ensemble des candidats."
    },
    {
      label: "Score max.",
      value: scores.length ? max(scores) : "-",
      icon: ArrowUpIcon,
      color: "text-red-600",
      description: "Score le plus élevé obtenu."
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-4 gap-2 mb-2">
        <Card className="p-4 flex flex-col items-center">
          <UsersIcon className="h-6 w-6 text-gray-500 mb-1" aria-hidden="true" />
          <div className="text-2xl font-bold">{candidates.length}</div>
          <div className="text-sm text-muted-foreground">Candidats</div>
        </Card>
        <Card className="p-4 flex flex-col items-center">
          <CheckCircleIcon className="h-6 w-6 text-green-600 mb-1" aria-hidden="true" />
          <div className="text-2xl font-bold">{admitted.length}</div>
          <div className="text-sm text-muted-foreground">Admis (≥ seuil %)</div>
        </Card>
        <Card className="p-4 flex flex-col items-center">
          <XCircleIcon className="h-6 w-6 text-red-600 mb-1" aria-hidden="true" />
          <div className="text-2xl font-bold">{refused.length}</div>
          <div className="text-sm text-muted-foreground">Refusés ({'<'} seuil %)</div>
        </Card>
        <Card className="p-4 flex flex-col items-center">
          <CheckCircleIcon className="h-6 w-6 text-blue-600 mb-1" aria-hidden="true" />
          <div className="text-2xl font-bold">{isNaN(Number(successRate)) ? '-' : successRate}%</div>
          <div className="text-sm text-muted-foreground">Taux de réussite</div>
          <div className="text-[10px] text-muted-foreground mt-1 text-center">% de candidats ayant un pourcentage de réussite ≥ seuil</div>
        </Card>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-2">
        <Card className="p-4 flex flex-col items-center">
          <CheckCircleIcon className="h-6 w-6 text-emerald-600 mb-1" aria-hidden="true" />
          <div className="text-lg font-semibold">{avgPct}%</div>
          <div className="text-xs text-muted-foreground">% moyen de réussite</div>
          <div className="text-[10px] text-muted-foreground mt-1 text-center">Pourcentage moyen de réussite sur l’ensemble des candidats</div>
        </Card>
        {stats.map((s) => (
          <Card key={s.label} className="p-4 flex flex-col items-center">
            <s.icon className={`h-6 w-6 mb-1 ${s.color}`} aria-hidden="true" />
            <div className="text-lg font-semibold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="text-[10px] text-muted-foreground mt-1 text-center">{s.description}</div>
          </Card>
        ))}
      </div>
      {/* <div className="grid grid-cols-4 gap-2">

      </div> */}
    </div>
  );
} 