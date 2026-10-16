export type Status =
  "Proposé" | "Actif" | "Réclamation" | "Litige" | "Clôturé" | "Annulé";
export type Role = "Locataire" | "Propriétaire" | "Arbitre";
export type Lease = {
  id: number;
  title: string;
  subtitle: string;
  deposit: number;
  status: Status;
  end: string;
  claim: number;
  history: string[];
};
export type Page = "Vue d’ensemble" | "Mes baux" | "Arbitrage";

export type LeaseFilter = Status | "Tous les baux";
