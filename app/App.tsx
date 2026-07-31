import { useEffect, useState } from "react";
import type { InvoiceData, RenderMode } from "../src/types.js";
import { Editor } from "./components/Editor.js";
import { Preview } from "./components/Preview.js";
import { freshInvoice } from "./samples.js";

export function App() {
  const [data, setData] = useState<InvoiceData>(() => freshInvoice());
  const [mode, setMode] = useState<RenderMode>("email");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>Invoice Studio</h1>
          <span className="tag">One invoice → email · web · PDF, from one component tree</span>
        </div>
        <div>
          <a href="https://github.com/DylPorter/elements-invoice" target="_blank" rel="noreferrer">
            Built with Unlayer Elements ↗
          </a>
        </div>
      </header>

      <div className="workbench">
        <Editor data={data} onChange={setData} />
        <Preview data={data} mode={mode} onModeChange={setMode} onToast={setToast} />
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
