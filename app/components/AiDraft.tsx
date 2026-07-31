import { useState } from "react";
import type { LineItem } from "../../src/types.js";
import { draftLineItemsFromText } from "../../src/adapters/freeform-deepseek.js";

interface Props {
  onDraft: (items: LineItem[]) => void;
  defaultRate: number;
  minorPerMajor: number;
}

const KEY_STORE = "elements-invoice.deepseek-key";

/**
 * Optional: draft line items from a freeform note via DeepSeek.
 * Gated behind a user-supplied key (kept only in localStorage, never bundled).
 * Off the critical path — the app is fully usable without ever opening this.
 */
export function AiDraft({ onDraft, defaultRate, minorPerMajor }: Props) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(KEY_STORE) ?? "");
  const [status, setStatus] = useState<{ kind: "idle" | "loading" | "ok" | "err"; msg: string }>({
    kind: "idle",
    msg: "",
  });

  if (!open) {
    return (
      <button className="btn ghost" style={{ width: "100%" }} onClick={() => setOpen(true)}>
        ✨ Draft from notes (optional, uses DeepSeek)
      </button>
    );
  }

  const run = async () => {
    if (!apiKey.trim()) {
      setStatus({ kind: "err", msg: "Enter a DeepSeek API key first." });
      return;
    }
    if (!notes.trim()) {
      setStatus({ kind: "err", msg: "Write a note describing the work." });
      return;
    }
    localStorage.setItem(KEY_STORE, apiKey.trim());
    setStatus({ kind: "loading", msg: "Drafting…" });
    try {
      const items = await draftLineItemsFromText(notes, {
        defaultRate,
        minorPerMajor,
        apiKey: apiKey.trim(),
      });
      if (!items.length) {
        setStatus({ kind: "err", msg: "No line items came back — try rephrasing." });
        return;
      }
      onDraft(items);
      setStatus({ kind: "ok", msg: `Drafted ${items.length} line item(s) — review and edit below.` });
    } catch (e) {
      setStatus({
        kind: "err",
        msg: `${e instanceof Error ? e.message : String(e)} (browser CORS can block this — the adapter also runs from Node.)`,
      });
    }
  };

  return (
    <div className="ai-box">
      <div className="field">
        <label>Notes</label>
        <textarea
          placeholder="api work tues–thurs ~14h, plus the logo redesign flat 5k"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="field">
        <label>DeepSeek API key (stored locally only)</label>
        <input
          type="password"
          placeholder="sk-…"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>
      <div className="btn-row">
        <button className="btn accent" onClick={run} disabled={status.kind === "loading"}>
          {status.kind === "loading" ? "Drafting…" : "Draft line items"}
        </button>
        <button className="btn ghost" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>
      {status.msg && (
        <p className={`ai-status ${status.kind === "err" ? "err" : status.kind === "ok" ? "ok" : ""}`}>
          {status.msg}
        </p>
      )}
      <p className="hint">
        Drafts are non-deterministic and meant for review — an invoice is a legal document, so the
        model never touches the totals. Replaces the current line items; edit them below before
        sending.
      </p>
    </div>
  );
}
