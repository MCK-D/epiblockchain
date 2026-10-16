import { Check, X } from "lucide-react";
import { motion } from "motion/react";
export function Toast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      className="toast"
      role="status"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <Check size={18} />
      {message}
      <button aria-label="Fermer la notification" onClick={onDismiss}>
        <X size={15} />
      </button>
    </motion.div>
  );
}
