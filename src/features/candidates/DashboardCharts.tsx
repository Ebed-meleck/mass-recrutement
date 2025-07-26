import { Card } from "@/components/ui/card";
import { mean, min, max, quartiles, histogram } from "./statistics";
import { Candidate } from "@/types/candidate";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { useMemo } from "react";
import type { TooltipItem } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface DashboardChartsProps {
  candidates: Candidate[];
  threshold: number;
}

export function DashboardCharts({ candidates, threshold }: DashboardChartsProps) {
  const scores = useMemo(() => candidates.map((c) => c.total_score).sort((a, b) => a - b), [candidates]);
  // Calcul admis/refusés basé sur le pourcentage partiel
  // const scoreKeys = candidates[0] ? Object.keys(candidates[0]).filter((k) => k.startsWith("score_")) : [];
  const getPct = (c: Candidate) => {
    const pourcentage = c.pourcentage
    if (!pourcentage) return 0;
    return Number(pourcentage);
  };
  const admitted = candidates.filter((c) => getPct(c) >= threshold);
  const refused = candidates.filter((c) => getPct(c) < threshold);
  // Stat par sexe
  const sexeCounts: Record<string, number> = {};
  for (const c of candidates) {
    const sexe = (c.fiche_id.sexe || "-").toString().trim();
    sexeCounts[sexe] = (sexeCounts[sexe] || 0) + 1;
  }
  const sexeLabels = Object.keys(sexeCounts);
  const sexeData = Object.values(sexeCounts);

  // Histogramme
  const hist = histogram(scores, 10);
  const histData = {
    labels: hist.map((h) => h.bin),
    datasets: [
      {
        label: "Nombre de candidats",
        data: hist.map((h) => h.count),
        backgroundColor: "#2563eb",
      },
    ],
  };
  const histOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Répartition des scores des candidats" },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) => `Score: ${ctx.label}, Nombre: ${ctx.parsed.y}`
        }
      }
    },
    scales: {
      x: { title: { display: true, text: "Score" } },
      y: { title: { display: true, text: "Nombre de candidats" } }
    }
  };

  // Camembert
  const pieData = {
    labels: ["Admis", "Refusés"],
    datasets: [
      {
        data: [admitted.length, refused.length],
        backgroundColor: ["#22c55e", "#ef4444"],
      },
    ],
  };
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' as const },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'pie'>) => {
            const total = admitted.length + refused.length;
            const value = ctx.parsed;
            const pct = total ? ((value / total) * 100).toFixed(1) : 0;
            return `${ctx.label}: ${value} (${pct}%)`;
          }
        }
      },
      title: { display: true, text: "Répartition Admis/Refusés" }
    }
  };

  // Barres stats (simplifiées)
  const q = quartiles(scores);
  const barStatsData = {
    labels: ["Min", "Médiane", "Moyenne", "Max"],
    datasets: [
      {
        label: "Score",
        data: [min(scores), q.q2, mean(scores), max(scores)],
        backgroundColor: ["#2563eb", "#a21caf", "#22c55e", "#ef4444"],
      },
    ],
  };
  const barStatsOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Statistiques clés (scores)" }
    },
    scales: {
      x: { title: { display: true, text: "Statistique" } },
      y: { title: { display: true, text: "Score" } }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="p-4">
        <Bar data={histData} options={histOptions} />
      </Card>
      <Card className="p-4 flex flex-col items-center justify-center">
        <Pie data={pieData} options={pieOptions} />
      </Card>
      <Card className="p-4">
        <Bar data={barStatsData} options={barStatsOptions} />
      </Card>
      <Card>
        <div className="font-semibold mb-2 text-center">Répartition par sexe</div>
        <div className="flex gap-2 justify-center mb-2">
        {sexeLabels.map((label, i) => (
          <span key={label} className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold" style={{backgroundColor: ["#2563eb", "#f59e42", "#22c55e", "#ef4444", "#a21caf"][i % 5], color: '#fff'}}>
            {label} : {sexeCounts[label]}
          </span>
        ))}
        </div>
        {sexeLabels.length > 1 && (
          <Pie
            data={{
              labels: sexeLabels,
              datasets: [
                {
                  data: sexeData,
                  backgroundColor: ["#2563eb", "#f59e42", "#22c55e", "#ef4444", "#a21caf"],
                },
              ],
            }}
            options={{ responsive: true, plugins: { legend: { position: 'bottom' as const }, title: { display: true, text: "Répartition par sexe" } } }}
          />
        )}
      </Card>
    </div>
  );
} 