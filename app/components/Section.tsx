import type { ReactNode } from "react";

/**
 * A titled card. Every group in the editor is one of these so the panel reads
 * as a stack of clearly separated sections rather than one continuous form.
 */
export function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="card">
      <header className="card-head">
        <h2>{title}</h2>
        {aside && <span className="card-aside">{aside}</span>}
      </header>
      <div className="card-body">{children}</div>
    </section>
  );
}
