import { useReadContract, useReadContracts } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { rentalDepositAddress } from "../config/contract";
import { rentalDepositAbi } from "../contracts/rentalDepositAbi";
import type { Lease } from "../types/lease";

export type LeaseRead =
  | { id: bigint; status: "success"; lease: Lease }
  | { id: bigint; status: "failure" };

export type LeasesState =
  | { status: "undeployed" }
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | { status: "success"; leases: LeaseRead[] };

// Lit tous les baux : leaseCount, puis getLease(1..leaseCount) en un seul
// appel multicall. Une lecture qui échoue reste un échec, jamais un bail vide.
export function useLeases(): LeasesState {
  const address = rentalDepositAddress;
  const count = useReadContract({
    address,
    abi: rentalDepositAbi,
    functionName: "leaseCount",
    chainId: baseSepolia.id,
    query: { enabled: address !== undefined },
  });

  const ids =
    count.data === undefined
      ? []
      : Array.from({ length: Number(count.data) }, (_, index) =>
          BigInt(index + 1),
        );

  const leases = useReadContracts({
    contracts: ids.map((id) => ({
      address,
      abi: rentalDepositAbi,
      functionName: "getLease",
      args: [id],
      chainId: baseSepolia.id,
    })),
    query: { enabled: address !== undefined && ids.length > 0 },
  });

  if (address === undefined) return { status: "undeployed" };
  if (count.isError) return { status: "error", retry: () => count.refetch() };
  if (count.data === undefined) return { status: "loading" };
  if (ids.length === 0) return { status: "success", leases: [] };
  if (leases.isError) return { status: "error", retry: () => leases.refetch() };
  if (!leases.data) return { status: "loading" };

  return {
    status: "success",
    leases: leases.data.map((read, index) =>
      read.status === "success"
        ? {
            id: ids[index],
            status: "success",
            lease: { id: ids[index], ...(read.result as Omit<Lease, "id">) },
          }
        : { id: ids[index], status: "failure" },
    ),
  };
}
