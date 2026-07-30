/**
 * The invoice data contract.
 *
 * Every adapter's job is to produce a valid `InvoiceData`; everything
 * downstream of it (compute, sections, entries, render) is deterministic.
 *
 * All monetary amounts are integers in **minor units** (e.g. HKD cents).
 * This is deliberate: representing money as floating-point `number` lets
 * rounding error accumulate, and an invoice is a document where the column
 * must add up exactly. Convert to a display string only at the edge, via
 * `formatMoney` in compute.ts.
 */

/** ISO-4217 currency code, e.g. "HKD". Used only for formatting. */
export type CurrencyCode = string;

/** The three render targets a single invoice tree can produce. */
export type RenderMode = "email" | "web" | "document";

export interface Party {
  /** Display name, e.g. "Aperture Studio". */
  name: string;
  /** Free-form address / registration lines, rendered in order. */
  lines?: string[];
  /** Optional contact email, shown on web/document. */
  email?: string;
}

/**
 * A billable line. Either time (`hours × rate`) or a flat fee.
 * `expense`-type reimbursables are modelled as `fixed` with `category: "expense"`
 * so the union stays small and the totals logic stays simple.
 */
export type LineItem =
  | {
      kind: "hourly";
      description: string;
      /** Quantity of hours; may be fractional (e.g. 12.5). */
      hours: number;
      /** Rate per hour, in minor units. */
      rate: number;
      category?: string;
    }
  | {
      kind: "fixed";
      description: string;
      /** Flat amount, in minor units. */
      amount: number;
      /** e.g. "expense" for a reimbursable; purely a display hint. */
      category?: string;
    };

/** Optional discount applied to the subtotal. */
export type Discount =
  | { kind: "percent"; label?: string; /** e.g. 10 for 10% */ value: number }
  | { kind: "fixed"; label?: string; /** minor units */ value: number };

/** Optional tax line, e.g. VAT/GST. Rate is a percentage. */
export interface Tax {
  /** Label shown on the invoice, e.g. "VAT (20%)" — free-form. */
  label: string;
  /** Percentage, e.g. 20 for 20%. Applied to (subtotal − discount). */
  rate: number;
}

export interface InvoiceData {
  /** Human invoice number, e.g. "2026-047". */
  number: string;
  /** ISO date the invoice was issued, e.g. "2026-07-12". */
  issueDate: string;
  /** ISO date payment is due, e.g. "2026-07-26". */
  dueDate: string;
  currency: CurrencyCode;
  /** Symbol/prefix for display, e.g. "HK$". */
  currencySymbol: string;

  from: Party;
  billTo: Party;

  lineItems: LineItem[];
  discount?: Discount;
  tax?: Tax;

  /** Amount already paid (e.g. a deposit), in minor units. Subtracted from total. */
  amountPaid?: number;

  /** Bank / payment instructions, rendered as a payment block. */
  payment?: {
    lines: string[];
    /** Reference the payer should quote, e.g. the invoice number. */
    reference?: string;
  };

  /** Optional note / thank-you shown at the foot (web/document). */
  notes?: string;

  /** URL the "Pay" button/link points at (email/web). */
  payUrl?: string;
  /** URL of the hosted web copy, used for the email "view in browser" link. */
  webUrl?: string;
}

/** Fully-derived monetary summary produced by `computeTotals`. All minor units. */
export interface InvoiceTotals {
  /** Per-line computed amounts, index-aligned with `lineItems`. */
  lineAmounts: number[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
}
