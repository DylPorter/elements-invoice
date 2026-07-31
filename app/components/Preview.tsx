import { useMemo } from "react";
import type { InvoiceData, RenderMode } from "../../src/types.js";
import { renderInvoice, downloadFile, printAsPdf, copyToClipboard } from "../preview.js";

interface Props {
  data: InvoiceData;
  mode: RenderMode;
  onModeChange: (m: RenderMode) => void;
  onToast: (msg: string) => void;
}

const TABS: { mode: RenderMode; label: string; note: string }[] = [
  { mode: "email", label: "Email", note: "what the inbox receives" },
  { mode: "web", label: "Web", note: "the hosted link" },
  { mode: "document", label: "PDF", note: "the filed record" },
];

export function Preview({ data, mode, onModeChange, onToast }: Props) {
  const { html, error } = useMemo(() => renderInvoice(data, mode), [data, mode]);

  const copy = async (text: string, label: string) => {
    const ok = await copyToClipboard(text);
    onToast(ok ? `${label} copied` : "Copy failed");
  };

  return (
    <div className="preview">
      <div className="tabbar">
        <div className="modes" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.mode}
              className={`tab ${t.mode === mode ? "active" : ""}`}
              onClick={() => onModeChange(t.mode)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="tab-note">{TABS.find((t) => t.mode === mode)?.note}</span>
        <span className="spacer" />
        <button
          className="btn"
          onClick={() => downloadFile(`${data.number}.${mode}.html`, html)}
          disabled={!!error}
        >
          Download HTML
        </button>
        <button className="btn primary" onClick={() => printAsPdf(data)} disabled={!!error}>
          Download PDF
        </button>
        <button className="btn ghost" onClick={() => copy(html, "HTML")} disabled={!!error}>
          Copy HTML
        </button>
        <button
          className="btn ghost"
          onClick={() => copy(JSON.stringify(data, null, 2), "JSON")}
        >
          Copy JSON
        </button>
      </div>

      {error ? (
        <div className="error-banner">Render error: {error}</div>
      ) : (
        <div className="stage">
          <iframe
            className={`frame ${mode}`}
            title={`Invoice preview — ${mode}`}
            srcDoc={html}
            sandbox="allow-same-origin"
          />
        </div>
      )}
    </div>
  );
}
