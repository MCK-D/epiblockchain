import { X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

type Props = { title: string; onClose: () => void; children: ReactNode };
export function Modal({ title, onClose, children }: Props) {
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    return () => previous?.focus();
  }, []);
  return (
    <motion.div
      className="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.section
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal"
        initial={{ y: 25, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const elements = dialog.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input, a[href], [tabindex="0"]',
          );
          if (!elements?.length) return;
          const first = elements[0],
            last = elements[elements.length - 1];
          if (
            event.shiftKey &&
            (document.activeElement === first ||
              document.activeElement === dialog.current)
          ) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <button className="close" aria-label="Fermer" onClick={onClose}>
          <X size={20} />
        </button>
        {children}
      </motion.section>
    </motion.div>
  );
}
