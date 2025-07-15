import { Candidate } from '@/types/candidate';

export function getScores(candidates: Candidate[]): number[] {
  return candidates.map((c) => c.total_score).sort((a, b) => a - b);
}

export function mean(scores: number[]): number {
  return scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
}

export function median(scores: number[]): number {
  const mid = Math.floor(scores.length / 2);
  if (scores.length % 2 === 0) {
    return (scores[mid - 1] + scores[mid]) / 2;
  }
  return scores[mid];
}

export function min(scores: number[]): number {
  return Math.min(...scores);
}

export function max(scores: number[]): number {
  return Math.max(...scores);
}

export function quartiles(scores: number[]): { q1: number; q2: number; q3: number } {
  const q2 = median(scores);
  const mid = Math.floor(scores.length / 2);
  const lower = scores.slice(0, mid);
  const upper = scores.length % 2 === 0 ? scores.slice(mid) : scores.slice(mid + 1);
  const q1 = median(lower);
  const q3 = median(upper);
  return { q1, q2, q3 };
}

export function histogram(scores: number[], bins = 10): { bin: string; count: number }[] {
  if (scores.length === 0) return [];
  const minScore = min(scores);
  const maxScore = max(scores);
  const binSize = (maxScore - minScore) / bins;
  if (binSize === 0) {
    // Tous les scores sont identiques, un seul bin
    return [{ bin: `${minScore.toFixed(1)}-${maxScore.toFixed(1)}`, count: scores.length }];
  }
  const hist = Array.from({ length: bins }, (_, i) => ({
    bin: `${(minScore + i * binSize).toFixed(1)}-${(minScore + (i + 1) * binSize).toFixed(1)}`,
    count: 0,
  }));
  for (const score of scores) {
    let idx = Math.floor((score - minScore) / binSize);
    if (idx === bins) idx = bins - 1;
    hist[idx].count++;
  }
  return hist;
} 