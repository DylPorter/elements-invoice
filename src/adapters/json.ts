/**
 * JSON adapter — validate an untrusted object into `InvoiceData`.
 *
 * Every adapter's contract is the same: produce a valid `InvoiceData` or throw
 * an actionable error. Nothing downstream re-validates, so this is the gate.
 */
import type { Discount, InvoiceData, LineItem, Party, Tax } from "../types.js";

class InvoiceValidationError extends Error {
  constructor(message: string) {
    super(`Invalid invoice data: ${message}`);
    this.name = "InvoiceValidationError";
  }
}

function str(v: unknown, path: string): string {
  if (typeof v !== "string" || v.length === 0)
    throw new InvoiceValidationError(`${path} must be a non-empty string`);
  return v;
}

function int(v: unknown, path: string): number {
  if (typeof v !== "number" || !Number.isFinite(v))
    throw new InvoiceValidationError(`${path} must be a finite number, got ${JSON.stringify(v)}`);
  return v;
}

function party(v: unknown, path: string): Party {
  if (typeof v !== "object" || v === null)
    throw new InvoiceValidationError(`${path} must be an object`);
  const o = v as Record<string, unknown>;
  const p: Party = { name: str(o.name, `${path}.name`) };
  if (o.lines !== undefined) {
    if (!Array.isArray(o.lines) || o.lines.some((l) => typeof l !== "string"))
      throw new InvoiceValidationError(`${path}.lines must be an array of strings`);
    p.lines = o.lines as string[];
  }
  if (o.email !== undefined) p.email = str(o.email, `${path}.email`);
  return p;
}

function lineItem(v: unknown, path: string): LineItem {
  if (typeof v !== "object" || v === null)
    throw new InvoiceValidationError(`${path} must be an object`);
  const o = v as Record<string, unknown>;
  const description = str(o.description, `${path}.description`);
  const category = o.category === undefined ? undefined : str(o.category, `${path}.category`);
  if (o.kind === "hourly") {
    return {
      kind: "hourly",
      description,
      hours: int(o.hours, `${path}.hours`),
      rate: int(o.rate, `${path}.rate`),
      category,
    };
  }
  if (o.kind === "fixed") {
    return { kind: "fixed", description, amount: int(o.amount, `${path}.amount`), category };
  }
  throw new InvoiceValidationError(`${path}.kind must be "hourly" or "fixed", got ${JSON.stringify(o.kind)}`);
}

function discount(v: unknown, path: string): Discount {
  const o = v as Record<string, unknown>;
  const label = o.label === undefined ? undefined : str(o.label, `${path}.label`);
  if (o.kind === "percent") return { kind: "percent", label, value: int(o.value, `${path}.value`) };
  if (o.kind === "fixed") return { kind: "fixed", label, value: int(o.value, `${path}.value`) };
  throw new InvoiceValidationError(`${path}.kind must be "percent" or "fixed"`);
}

function tax(v: unknown, path: string): Tax {
  const o = v as Record<string, unknown>;
  return { label: str(o.label, `${path}.label`), rate: int(o.rate, `${path}.rate`) };
}

/** Parse + validate an untrusted value (already-parsed JSON) into InvoiceData. */
export function fromJson(input: unknown): InvoiceData {
  if (typeof input !== "object" || input === null)
    throw new InvoiceValidationError("top-level value must be an object");
  const o = input as Record<string, unknown>;

  if (!Array.isArray(o.lineItems) || o.lineItems.length === 0)
    throw new InvoiceValidationError("lineItems must be a non-empty array");

  const data: InvoiceData = {
    number: str(o.number, "number"),
    issueDate: str(o.issueDate, "issueDate"),
    dueDate: str(o.dueDate, "dueDate"),
    currency: str(o.currency, "currency"),
    currencySymbol: str(o.currencySymbol, "currencySymbol"),
    from: party(o.from, "from"),
    billTo: party(o.billTo, "billTo"),
    lineItems: o.lineItems.map((li, i) => lineItem(li, `lineItems[${i}]`)),
  };

  if (o.discount !== undefined) data.discount = discount(o.discount, "discount");
  if (o.tax !== undefined) data.tax = tax(o.tax, "tax");
  if (o.amountPaid !== undefined) data.amountPaid = int(o.amountPaid, "amountPaid");
  if (o.notes !== undefined) data.notes = str(o.notes, "notes");
  if (o.payUrl !== undefined) data.payUrl = str(o.payUrl, "payUrl");
  if (o.webUrl !== undefined) data.webUrl = str(o.webUrl, "webUrl");
  if (o.payment !== undefined) {
    const p = o.payment as Record<string, unknown>;
    if (!Array.isArray(p.lines) || p.lines.some((l) => typeof l !== "string"))
      throw new InvoiceValidationError("payment.lines must be an array of strings");
    data.payment = {
      lines: p.lines as string[],
      reference: p.reference === undefined ? undefined : str(p.reference, "payment.reference"),
    };
  }

  return data;
}

/** Convenience: parse a JSON string then validate. */
export function fromJsonString(json: string): InvoiceData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    throw new InvoiceValidationError(`not valid JSON: ${(e as Error).message}`);
  }
  return fromJson(parsed);
}

export { InvoiceValidationError };
