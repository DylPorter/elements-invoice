import { useState, type ReactNode } from "react";

/**
 * A quiet disclosure section. Optional invoice details (adjustments, payment,
 * AI) live inside these, closed by default, so the editor reads as a short form
 * instead of a wall of every possible field.
 */
export function Collapsible({
  title,
  hint,
  defaultOpen = false,
  children,
}: {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`disclosure ${open ? "open" : ""}`}>
      <button className="disclosure-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="chevron" aria-hidden>
          ›
        </span>
        <span className="disclosure-title">{title}</span>
        {hint && !open && <span className="disclosure-hint">{hint}</span>}
      </button>
      {open && <div className="disclosure-body">{children}</div>}
    </div>
  );
}
