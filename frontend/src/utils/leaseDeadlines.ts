import type { Lease, Role } from "../types/lease";

// Mêmes valeurs que l'enum Status du contrat.
export const ACTIVE = 1;
export const CLAIMED = 2;
export const DISPUTED = 3;
export const CLOSED = 4;

// Délais fixés au déploiement (claimWindow, responseWindow, arbitrationWindow).
export type Windows = {
  claim: bigint;
  response: bigint;
  arbitration: bigint;
};

// Actions de la partie 2 qu'une adresse peut lancer sur un bail.
export type EndOfLeaseAction =
  | "releaseAll"
  | "claim"
  | "acceptClaim"
  | "refundAfterTimeout"
  | "acceptAfterTimeout"
  | "resolveAfterTimeout";

// Échéances du bail. Une action « dans le délai » est permise tant que
// `maintenant <= échéance`, la fonction `...AfterTimeout` seulement après,
// comme dans le contrat.
export function deadlinesOf(lease: Lease, windows: Windows) {
  return {
    claimDeadline: lease.endDate + windows.claim,
    responseDeadline: lease.claimedAt + windows.response,
    arbitrationDeadline: lease.disputedAt + windows.arbitration,
  };
}

// Reprend les règles du contrat pour n'afficher que les boutons utiles. Le
// contrat reste la seule autorité : chaque appel est simulé avant signature.
export function availableActions(
  lease: Lease,
  roles: Role[],
  windows: Windows,
  now: bigint,
): EndOfLeaseAction[] {
  const { claimDeadline, responseDeadline, arbitrationDeadline } = deadlinesOf(
    lease,
    windows,
  );
  const isLandlord = roles.includes("Propriétaire");
  const isTenant = roles.includes("Locataire");
  const actions: EndOfLeaseAction[] = [];

  if (lease.status === ACTIVE) {
    if (isLandlord) actions.push("releaseAll");
    if (isLandlord && now >= lease.endDate && now <= claimDeadline)
      actions.push("claim");
    if (now > claimDeadline) actions.push("refundAfterTimeout");
  }
  if (lease.status === CLAIMED) {
    if (isTenant) actions.push("acceptClaim");
    if (now > responseDeadline) actions.push("acceptAfterTimeout");
  }
  if (lease.status === DISPUTED && now > arbitrationDeadline)
    actions.push("resolveAfterTimeout");

  return actions;
}

// « dans 1 min 05 s », « il y a 3 j 2 h », pour suivre des délais de quelques
// minutes en démonstration comme de plusieurs semaines en production.
export function formatRemaining(deadline: bigint, now: bigint): string {
  const past = deadline < now;
  let seconds = Number(past ? now - deadline : deadline - now);
  const days = Math.floor(seconds / 86400);
  seconds -= days * 86400;
  const hours = Math.floor(seconds / 3600);
  seconds -= hours * 3600;
  const minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;

  let text: string;
  if (days > 0) text = `${days} j ${hours} h`;
  else if (hours > 0)
    text = `${hours} h ${String(minutes).padStart(2, "0")} min`;
  else if (minutes > 0)
    text = `${minutes} min ${String(seconds).padStart(2, "0")} s`;
  else text = `${seconds} s`;

  return past ? `il y a ${text}` : `dans ${text}`;
}
