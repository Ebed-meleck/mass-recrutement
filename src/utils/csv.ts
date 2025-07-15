/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import { Candidate } from '@/types/candidate';
import Papa from 'papaparse';

export const candidateSchema = z.object({
  'fiche_id-nom': z.string(),
  'fiche_id-post_nom': z.string(),
  'fiche_id-prenom': z.string(),
  total_score: z.preprocess((val) => Number(val), z.number()),
});

export function parseCSV(csv: string): Candidate[] {
  const candidates: Candidate[] = [];
  const { data } = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  for (const row of data as any[]) {
    const parsed = candidateSchema.safeParse(row);
    if (parsed.success) {
      candidates.push({
        nom: parsed.data['fiche_id-nom'],
        post_nom: parsed.data['fiche_id-post_nom'],
        prenom: parsed.data['fiche_id-prenom'],
        total_score: parsed.data.total_score,
        ...row,
      });
    }
    // sinon, ignorer la ligne ou logger l'erreur
  }
  return candidates;
} 