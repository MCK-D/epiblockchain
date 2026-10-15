import { ArrowUpRight, House } from "lucide-react";
import { motion } from "motion/react";
import type { Lease } from "../../types/lease";
import { date, eth } from "../../utils/format";

type Props = { lease: Lease; index: number; onSelect: (lease: Lease) => void };
export function LeaseRow({ lease, index, onSelect }: Props) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => {
        onSelect(lease);
      }}
    >
      <td>
        <div className={"property-icon p" + index}>
          <House size={21} />
        </div>
        <div>
          <strong>{lease.title}</strong>
          <small>
            #{lease.id} <span>·</span> {lease.subtitle}
          </small>
        </div>
      </td>
      <td className="amount">
        {eth(lease.deposit)}
        <small>Dépôt de garantie</small>
      </td>
      <td>
        <span className={"badge status-" + lease.status.toLowerCase()}>
          <span />
          {lease.status === "Proposé" ? "À financer" : lease.status}
        </span>
      </td>
      <td className="date">{date(lease.end)}</td>
      <td>
        <button className="row-arrow" aria-label={"Ouvrir le bail " + lease.id}>
          <ArrowUpRight size={18} />
        </button>
      </td>
    </motion.tr>
  );
}
