import { useState, type ReactNode } from "react";

/**
 * A collapsible card. Shares the card chrome with `Section` so open and closed
 * groups sit in the same visual rhythm — the header is always a clear boundary,
 * and the body is divided from it by a rule when expanded.
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
    <section className={`card collapsible ${open ? "open" : ""}`}>
      <button className="card-head trigger" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <h2>{title}</h2>
        {hint && <span className="card-aside">{hint}</span>}
        <svg className="chevron" viewBox="0 0 24 24" aria-hidden focusable="false">
          <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && <div className="card-body">{children}</div>}
    </section>
  );
}
