// Service utilitaire pour récupérer les données depuis ODK Central via le backend
export interface FetchOdkCentralParams {
  reportId: string;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  splitDate?: boolean;
  barcodeOnly?: boolean;
}

export async function fetchOdkCentralData(): Promise<unknown> {
  // Appel GET vers l'API Next.js
  const response = await fetch('/api/submissions');
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des données ODK Central');
  }
  return response.json();
} 