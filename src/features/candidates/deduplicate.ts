import { Candidate } from '@/types/candidate';

export interface DeduplicationResult {
  uniqueCandidates: Candidate[];
  duplicates: { key: string; count: number; candidates: Candidate[] }[];
}

export function deduplicateCandidates(candidates: Candidate[]): DeduplicationResult {
  const seen = new Map<string, Candidate>();
  const duplicateMap = new Map<string, Candidate[]>();

  for (const candidate of candidates) {
    const key = `${candidate.fiche_id.nom.trim().toLowerCase()}_${candidate.fiche_id.post_nom.trim().toLowerCase()}_${candidate.fiche_id.prenom.trim().toLowerCase()}`;
    if (seen.has(key)) {
      if (!duplicateMap.has(key)) {
        duplicateMap.set(key, [seen.get(key)!]);
      }
      duplicateMap.get(key)!.push(candidate);
    } else {
      seen.set(key, candidate);
    }
  }

  const uniqueCandidates = Array.from(seen.values());
  const duplicates = Array.from(duplicateMap.entries()).map(([key, candidates]) => ({
    key,
    count: candidates.length,
    candidates,
  }));

  return { uniqueCandidates, duplicates };
} 