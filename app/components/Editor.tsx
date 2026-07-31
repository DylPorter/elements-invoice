import type { InvoiceData, LineItem } from "../../src/types.js";
import { minorToMajor, majorToMinor } from "../money.js";
import { SAMPLES, BLANK } from "../samples.js";
import { AiDraft } from "./AiDraft.js";

interface Props {
  data: InvoiceData;
  onChange: (next: InvoiceData) => void;
}

/** Common currency presets; symbol travels with the code. */
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
      {/* Presets */}
      <div className="section-title">Start from</div>
      <div className="btn-row">
        <select
          className="btn"
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
        <button className="btn ghost" onClick={() => onChange(structuredClone(BLANK))}>
          Blank
        </button>
      </div>

      {/* AI draft */}
      <div className="section-title">Draft line items from notes ✨</div>
      <AiDraft
        onDraft={(items) => patch({ lineItems: items })}
        defaultRate={firstRate(data)}
        minorPerMajor={100}
      />

      {/* Invoice meta */}
      <div className="section-title">Invoice</div>
      <div className="row-3">
        <div className="field">
          <label>Number</label>
          <input value={data.number} onChange={(e) => patch({ number: e.target.value })} />
        </div>
        <div className="field">
          <label>Issued</label>
          <input
            type="date"
            value={data.issueDate}
            onChange={(e) => patch({ issueDate: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Due</label>
          <input
            type="date"
            value={data.dueDate}
            onChange={(e) => patch({ dueDate: e.target.value })}
          />
        </div>
      </div>
      <div className="field">
        <label>Currency</label>
        <select
          value={data.currency}
          onChange={(e) =>
            patch({ currency: e.target.value, currencySymbol: CURRENCIES[e.target.value] ?? "$" })
          }
        >
          {Object.keys(CURRENCIES).map((c) => (
            <option key={c} value={c}>
              {c} ({CURRENCIES[c]})
            </option>
          ))}
        </select>
      </div>

      {/* Parties */}
      <div className="section-title">From</div>
      <PartyFields party={data.from} onChange={(from) => patch({ from })} />
      <div className="section-title">Billed to</div>
      <PartyFields party={data.billTo} onChange={(billTo) => patch({ billTo })} />

      {/* Line items */}
      <div className="section-title">Line items</div>
      {data.lineItems.map((item, i) => (
        <LineItemFields
          key={i}
          item={item}
          onChange={(l) => setLine(i, l)}
          onRemove={() => removeLine(i)}
          canRemove={data.lineItems.length > 1}
        />
      ))}
      <button className="btn add-line" onClick={addLine}>
        + Add line
      </button>

      {/* Adjustments */}
      <div className="section-title">Adjustments</div>
      <div className="row-2">
        <div className="field">
          <label>Discount</label>
          <input
            placeholder="e.g. 10% or 500"
            value={discountToStr(data)}
            onChange={(e) => patch({ discount: parseDiscount(e.target.value) })}
          />
        </div>
        <div className="field">
          <label>Deposit paid ({data.currencySymbol})</label>
          <input
            type="number"
            step="0.01"
            value={data.amountPaid ? minorToMajor(data.amountPaid) : ""}
            onChange={(e) =>
              patch({ amountPaid: e.target.value ? majorToMinor(e.target.value) : undefined })
            }
          />
        </div>
      </div>
      <div className="row-2">
        <div className="field">
          <label>Tax label</label>
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
        </div>
        <div className="field">
          <label>Tax rate %</label>
          <input
            type="number"
            step="0.1"
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
        </div>
      </div>

      {/* Payment + notes */}
      <div className="section-title">Payment details</div>
      <div className="field">
        <textarea
          placeholder="One line per row, e.g. Bank transfer — HSBC HK"
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
      </div>
      <div className="row-2">
        <div className="field">
          <label>Payment reference</label>
          <input
            value={data.payment?.reference ?? ""}
            onChange={(e) =>
              patch({
                payment: { lines: data.payment?.lines ?? [], reference: e.target.value },
              })
            }
          />
        </div>
        <div className="field">
          <label>Pay URL (email/web button)</label>
          <input
            value={data.payUrl ?? ""}
            onChange={(e) => patch({ payUrl: e.target.value || undefined })}
          />
        </div>
      </div>
      <div className="field">
        <label>Notes</label>
        <input
          value={data.notes ?? ""}
          onChange={(e) => patch({ notes: e.target.value || undefined })}
        />
      </div>
    </div>
  );
}

function firstRate(data: InvoiceData): number {
  const h = data.lineItems.find((l) => l.kind === "hourly");
  return h && h.kind === "hourly" ? h.rate : 30000;
}

function PartyFields({
  party,
  onChange,
}: {
  party: InvoiceData["from"];
  onChange: (p: InvoiceData["from"]) => void;
}) {
  return (
    <>
      <div className="field">
        <input
          placeholder="Name"
          value={party.name}
          onChange={(e) => onChange({ ...party, name: e.target.value })}
        />
      </div>
      <div className="field">
        <textarea
          placeholder="Address lines — one per row"
          value={(party.lines ?? []).join("\n")}
          onChange={(e) => onChange({ ...party, lines: e.target.value.split("\n").filter(Boolean) })}
        />
      </div>
    </>
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
    <div className="lineitem">
      <div className="li-head">
        <div className="kind-toggle">
          <button
            className={item.kind === "hourly" ? "active" : ""}
            onClick={() =>
              onChange({ kind: "hourly", description: item.description, hours: 1, rate: 30000 })
            }
          >
            Hourly
          </button>
          <button
            className={item.kind === "fixed" ? "active" : ""}
            onClick={() =>
              onChange({ kind: "fixed", description: item.description, amount: 0 })
            }
          >
            Fixed
          </button>
        </div>
        {canRemove && (
          <button className="icon-btn" onClick={onRemove} title="Remove line">
            ×
          </button>
        )}
      </div>
      <div className="field">
        <input
          placeholder="Description"
          value={item.description}
          onChange={(e) => onChange({ ...item, description: e.target.value })}
        />
      </div>
      {item.kind === "hourly" ? (
        <div className="row-2">
          <div className="field">
            <label>Hours</label>
            <input
              type="number"
              step="0.25"
              value={item.hours}
              onChange={(e) => onChange({ ...item, hours: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="field">
            <label>Rate / hour</label>
            <input
              type="number"
              step="0.01"
              value={minorToMajor(item.rate)}
              onChange={(e) => onChange({ ...item, rate: majorToMinor(e.target.value) })}
            />
          </div>
        </div>
      ) : (
        <div className="row-2">
          <div className="field">
            <label>Amount</label>
            <input
              type="number"
              step="0.01"
              value={minorToMajor(item.amount)}
              onChange={(e) => onChange({ ...item, amount: majorToMinor(e.target.value) })}
            />
          </div>
          <div className="field">
            <label>Category (optional)</label>
            <input
              placeholder="e.g. Expense"
              value={item.category ?? ""}
              onChange={(e) => onChange({ ...item, category: e.target.value || undefined })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- discount string <-> Discount ---- */
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
