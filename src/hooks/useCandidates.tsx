import { useEffect, useState } from 'react';
import { parseCSV } from '@/utils/csv';
import { deduplicateCandidates, DeduplicationResult } from '@/features/candidates/deduplicate';

export function useCandidates() {
  const [data, setData] = useState<DeduplicationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/src/data/fm_gc7_eq_form_test_sup_independant.csv')
      .then((res) => res.text())
      .then((csv) => {
        const candidates = parseCSV(csv);
        setData(deduplicateCandidates(candidates));
        setLoading(false);
      })
      .catch(() => {
        setError('Erreur lors du chargement des données');
        setLoading(false);
      });
  }, []);

  return { ...data, loading, error };
} 