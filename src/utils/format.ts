export const eth = (n: number) =>
  n.toLocaleString("fr-FR", { maximumFractionDigits: 4 }) + " ETH";
export const date = (s: string) =>
  new Date(s + "T12:00:00").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
