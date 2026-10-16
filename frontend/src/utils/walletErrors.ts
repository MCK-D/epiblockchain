import { UserRejectedRequestError } from "viem";

export function walletErrorMessage(error: unknown): string {
  let cause = error;
  for (
    let depth = 0;
    depth < 8 && cause && typeof cause === "object";
    depth++
  ) {
    if (
      cause instanceof UserRejectedRequestError ||
      ("code" in cause && cause.code === 4001)
    )
      return "Demande refusée dans le portefeuille. Vous pouvez réessayer.";
    if ("code" in cause && cause.code === -32002)
      return "Une demande est déjà en attente. Ouvrez votre portefeuille pour y répondre.";
    if ("code" in cause && cause.code === 4900)
      return "Le portefeuille est déconnecté. Ouvrez-le et réessayez.";
    cause = "cause" in cause ? cause.cause : undefined;
  }
  return "La demande n’a pas abouti. Vérifiez votre portefeuille et réessayez.";
}
