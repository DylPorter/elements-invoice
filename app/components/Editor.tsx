import type { ReactNode } from "react";
import type { InvoiceData, LineItem } from "../../src/types.js";
import { minorToMajor, majorToMinor } from "../money.js";
import { SAMPLES, BLANK } from "../samples.js";
import { AiDraft } from "./AiDraft.js";
import { Collapsible } from "./Collapsible.js";

interface Props {
  data: InvoiceData;
  onChange: (next: InvoiceData) => void;
}

const CURRENCIES: Record<string, string> = {
  HKD: "HK$",
  USD: "$",
  EUR: "€",
  GBP: "£",
  SGD: "S$",
  AUD: "A$",
};

export function Editor({ data, onChange }: Props) {
  const patch = (p: Partial<InvoiceData>) => onChange({ ...data, ...p });

  const setLine = (i: number, line: LineItem) => {
    const lineItems = data.lineItems.slice();
    lineItems[i] = line;
    patch({ lineItems });
  };
  const addLine = () =>
    patch({
      lineItems: [...data.lineItems, { kind: "hourly", description: "", hours: 1, rate: 30000 }],
    });
  const removeLine = (i: number) =>
    patch({ lineItems: data.lineItems.filter((_, j) => j !== i) });

  return (
    <div className="editor">
      {/* Quiet toolbar */}
      <div className="editor-toolbar">
        <select
          value=""
          onChange={(e) => {
            const s = SAMPLES.find((x) => x.id === e.target.value);
            if (s) onChange(structuredClone(s.data));
          }}
        >
          <option value="">Load a sample…</option>
          {SAMPLES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <button className="link-btn" onClick={() => onChange(structuredClone(BLANK))}>
          Start blank
        </button>
      </div>

      {/* Meta strip */}
      <div className="grid-4">
        <Labeled label="Invoice #">
          <input value={data.number} onChange={(e) => patch({ number: e.target.value })} />
        </Labeled>
        <Labeled label="Currency">
          <select
            value={data.currency}
            onChange={(e) =>
              patch({ currency: e.target.value, currencySymbol: CURRENCIES[e.target.value] ?? "$" })
            }
          >
            {Object.keys(CURRENCIES).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Labeled>
        <Labeled label="Issued">
          <input
            type="date"
            value={data.issueDate}
            onChange={(e) => patch({ issueDate: e.target.value })}
          />
        </Labeled>
        <Labeled label="Due">
          <input
            type="date"
            value={data.dueDate}
            onChange={(e) => patch({ dueDate: e.target.value })}
          />
        </Labeled>
      </div>

      {/* Parties */}
      <div className="grid-2 parties">
        <PartyFields label="From" party={data.from} onChange={(from) => patch({ from })} />
        <PartyFields label="Bill to" party={data.billTo} onChange={(billTo) => patch({ billTo })} />
      </div>

      {/* Line items — the centrepiece */}
      <div className="items-head">
        <span>Line items</span>
        <span className="muted-note">hourly or fixed</span>
      </div>
      <div className="items">
        {data.lineItems.map((item, i) => (
          <LineItemFields
            key={i}
            item={item}
            onChange={(l) => setLine(i, l)}
            onRemove={() => removeLine(i)}
            canRemove={data.lineItems.length > 1}
          />
        ))}
      </div>
      <button className="add-line" onClick={addLine}>
        + Add line
      </button>

      {/* Optional, tucked away */}
      <Collapsible title="Discount, tax & deposit" hint={adjustmentsHint(data)}>
        <div className="grid-2">
          <Labeled label="Discount (e.g. 10% or 500)">
            <input
              placeholder="none"
              value={discountToStr(data)}
              onChange={(e) => patch({ discount: parseDiscount(e.target.value) })}
            />
          </Labeled>
          <Labeled label={`Deposit paid (${data.currencySymbol})`}>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={data.amountPaid ? minorToMajor(data.amountPaid) : ""}
              onChange={(e) =>
                patch({ amountPaid: e.target.value ? majorToMinor(e.target.value) : undefined })
              }
            />
          </Labeled>
          <Labeled label="Tax label">
            <input
              placeholder="e.g. VAT (20%)"
              value={data.tax?.label ?? ""}
              onChange={(e) =>
                patch({
                  tax: e.target.value
                    ? { label: e.target.value, rate: data.tax?.rate ?? 0 }
                    : undefined,
                })
              }
            />
          </Labeled>
          <Labeled label="Tax rate %">
            <input
              type="number"
              step="0.1"
              placeholder="0"
              value={data.tax?.rate ?? ""}
              onChange={(e) =>
                patch({
                  tax: {
                    label: data.tax?.label ?? `Tax (${e.target.value}%)`,
                    rate: parseFloat(e.target.value) || 0,
                  },
                })
              }
            />
          </Labeled>
        </div>
      </Collapsible>

      <Collapsible title="Payment & notes" hint={data.payment?.reference ? `ref ${data.payment.reference}` : undefined}>
        <Labeled label="Payment details (one line per row)">
          <textarea
            placeholder="Bank transfer — HSBC HK&#10;Acct 000-123456-001"
            value={(data.payment?.lines ?? []).join("\n")}
            onChange={(e) =>
              patch({
                payment: {
                  lines: e.target.value.split("\n").filter(Boolean),
                  reference: data.payment?.reference,
                },
              })
            }
          />
        </Labeled>
        <div className="grid-2">
          <Labeled label="Reference">
            <input
              value={data.payment?.reference ?? ""}
              onChange={(e) =>
                patch({ payment: { lines: data.payment?.lines ?? [], reference: e.target.value } })
              }
            />
          </Labeled>
          <Labeled label="Pay button URL">
            <input
              placeholder="https://…"
              value={data.payUrl ?? ""}
              onChange={(e) => patch({ payUrl: e.target.value || undefined })}
            />
          </Labeled>
        </div>
        <Labeled label="Note at the foot">
          <input
            placeholder="Thank you for your business."
            value={data.notes ?? ""}
            onChange={(e) => patch({ notes: e.target.value || undefined })}
          />
        </Labeled>
      </Collapsible>

      <Collapsible title="Draft line items from notes" hint="AI · optional">
        <AiDraft
          onDraft={(items) => patch({ lineItems: items })}
          defaultRate={firstRate(data)}
          minorPerMajor={100}
        />
      </Collapsible>
    </div>
  );
}

/* ---- small building blocks ---- */

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="labeled">
      <span>{label}</span>
      {children}
    </label>
  );
}

function firstRate(data: InvoiceData): number {
  const h = data.lineItems.find((l) => l.kind === "hourly");
  return h && h.kind === "hourly" ? h.rate : 30000;
}

function PartyFields({
  label,
  party,
  onChange,
}: {
  label: string;
  party: InvoiceData["from"];
  onChange: (p: InvoiceData["from"]) => void;
}) {
  return (
    <div className="party">
      <div className="party-label">{label}</div>
      <input
        className="party-name"
        placeholder="Name"
        value={party.name}
        onChange={(e) => onChange({ ...party, name: e.target.value })}
      />
      <textarea
        placeholder="Address — one line per row"
        value={(party.lines ?? []).join("\n")}
        onChange={(e) => onChange({ ...party, lines: e.target.value.split("\n").filter(Boolean) })}
      />
    </div>
  );
}

function LineItemFields({
  item,
  onChange,
  onRemove,
  canRemove,
}: {
  item: LineItem;
  onChange: (l: LineItem) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="item">
      <div className="item-top">
        <input
          className="item-desc"
          placeholder="Description"
          value={item.description}
          onChange={(e) => onChange({ ...item, description: e.target.value })}
        />
        {canRemove && (
          <button className="remove" onClick={onRemove} title="Remove line" aria-label="Remove line">
            ×
          </button>
        )}
      </div>
      <div className="item-controls">
        <div className="kind-toggle">
          <button
            className={item.kind === "hourly" ? "active" : ""}
            onClick={() =>
              item.kind !== "hourly" &&
              onChange({ kind: "hourly", description: item.description, hours: 1, rate: 30000 })
            }
          >
            Hourly
          </button>
          <button
            className={item.kind === "fixed" ? "active" : ""}
            onClick={() =>
              item.kind !== "fixed" && onChange({ kind: "fixed", description: item.description, amount: 0 })
            }
          >
            Fixed
          </button>
        </div>
        {item.kind === "hourly" ? (
          <>
            <input
              className="num"
              type="number"
              step="0.25"
              aria-label="Hours"
              placeholder="hrs"
              value={item.hours}
              onChange={(e) => onChange({ ...item, hours: parseFloat(e.target.value) || 0 })}
            />
            <span className="times">×</span>
            <input
              className="num"
              type="number"
              step="0.01"
              aria-label="Rate per hour"
              placeholder="rate"
              value={minorToMajor(item.rate)}
              onChange={(e) => onChange({ ...item, rate: majorToMinor(e.target.value) })}
            />
          </>
        ) : (
          <input
            className="num wide"
            type="number"
            step="0.01"
            aria-label="Amount"
            placeholder="amount"
            value={minorToMajor(item.amount)}
            onChange={(e) => onChange({ ...item, amount: majorToMinor(e.target.value) })}
          />
        )}
      </div>
    </div>
  );
}

/* ---- helpers ---- */
function adjustmentsHint(data: InvoiceData): string | undefined {
  const bits: string[] = [];
  if (data.discount) bits.push("discount");
  if (data.tax?.rate) bits.push(data.tax.label);
  if (data.amountPaid) bits.push("deposit");
  return bits.length ? bits.join(" · ") : undefined;
}
function discountToStr(data: InvoiceData): string {
  const d = data.discount;
  if (!d) return "";
  return d.kind === "percent" ? `${d.value}%` : minorToMajor(d.value);
}
function parseDiscount(s: string): InvoiceData["discount"] {
  const t = s.trim();
  if (!t) return undefined;
  if (t.endsWith("%")) {
    const v = parseFloat(t.slice(0, -1));
    return Number.isFinite(v) ? { kind: "percent", value: v } : undefined;
  }
  const v = majorToMinor(t);
  return v > 0 ? { kind: "fixed", value: v } : undefined;
}
