/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Candidate {
  fiche_id : {
    nom: string;
    post_nom: string;
    prenom: string;
    sexe: string;
  };
  total_score: number;
  [key: string]: string | number | { [key: string]: any };
};

export type CandidateStatus = 'admis' | 'refuse'; 