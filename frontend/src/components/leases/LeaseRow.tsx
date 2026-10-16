import { ChevronRight } from "lucide-react";
import type { Lease } from "../../types/lease";
import { date, eth } from "../../utils/format";

type Props = { lease: Lease; onSelect: (lease: Lease) => void };
export function LeaseRow({ lease, onSelect }: Props) {
  return (
    <tr
      tabIndex={0}
      aria-label={`Ouvrir le bail ${lease.title}`}
      onClick={() => onSelect(lease)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(lease);
        }
      }}
    >
      <td>
        <strong>{lease.title}</strong>
        <small>
          {lease.subtitle}, n° {lease.id}
        </small>
      </td>
      <td className="amount">{eth(lease.deposit)}</td>
      <td>
        <span className={"badge status-" + lease.status.toLowerCase()}>
          {lease.status === "Proposé" ? "À financer" : lease.status}
        </span>
      </td>
      <td className="date">{date(lease.end)}</td>
      <td>
        <span className="row-arrow" aria-hidden="true">
          <ChevronRight size={18} />
        </span>
      </td>
    </tr>
  );
}
