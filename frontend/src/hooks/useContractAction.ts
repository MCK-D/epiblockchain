import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Hash, TransactionReceipt } from "viem";
import { useConfig, type Config } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { contractErrorMessage } from "../utils/contractErrors";

export type ActionState =
  | { status: "idle" }
  | { status: "wallet" }
  | { status: "pending"; hash: Hash }
  | { status: "success"; hash: Hash }
  | { status: "error"; message: string };

// Suit une transaction de bout en bout : signature dans le portefeuille,
// attente de l'inclusion dans un bloc, puis rechargement des lectures.
export function useContractAction() {
  const config = useConfig();
  const queryClient = useQueryClient();
  const [state, setState] = useState<ActionState>({ status: "idle" });

  async function run(
    send: (config: Config) => Promise<Hash>,
  ): Promise<TransactionReceipt | undefined> {
    setState({ status: "wallet" });
    try {
      const hash = await send(config);
      setState({ status: "pending", hash });
      const receipt = await waitForTransactionReceipt(config, { hash });
      if (receipt.status === "reverted") {
        setState({
          status: "error",
          message: "La transaction a été annulée par le contrat.",
        });
        return undefined;
      }
      setState({ status: "success", hash });
      await queryClient.invalidateQueries();
      return receipt;
    } catch (error) {
      setState({ status: "error", message: contractErrorMessage(error) });
      return undefined;
    }
  }

  return {
    state,
    busy: state.status === "wallet" || state.status === "pending",
    run,
    reset: () => setState({ status: "idle" }),
  };
}
