/**
 * Deterministic money math. No React, no I/O — pure functions over `InvoiceData`.
 *
 * Amounts are integer minor units throughout. Line amounts are rounded once,
 * at the line level, and the subtotal is the sum of those rounded lines — so
 * the printed column always tallies to the printed subtotal.
 */
import type { InvoiceData, InvoiceTotals, LineItem } from "./types.js";

/** Amount for a single line, in minor units, rounded to the nearest unit. */
export function lineAmount(item: LineItem): number {
  if (item.kind === "fixed") return Math.round(item.amount);
  return Math.round(item.hours * item.rate);
}

/**
 * Derive every monetary figure on the invoice.
 *
 * Order of operations: subtotal → discount → tax on the discounted base →
 * total → subtract amountPaid → balance due.
 */
export function computeTotals(data: InvoiceData): InvoiceTotals {
  const lineAmounts = data.lineItems.map(lineAmount);
  const subtotal = lineAmounts.reduce((a, b) => a + b, 0);

  let discountAmount = 0;
  if (data.discount) {
    discountAmount =
      data.discount.kind === "percent"
        ? Math.round((subtotal * data.discount.value) / 100)
        : Math.round(data.discount.value);
  }
  // A discount can never exceed the subtotal.
  discountAmount = Math.min(discountAmount, subtotal);

  const taxableBase = subtotal - discountAmount;
  const taxAmount = data.tax ? Math.round((taxableBase * data.tax.rate) / 100) : 0;

  const total = taxableBase + taxAmount;
  const amountPaid = Math.max(0, Math.round(data.amountPaid ?? 0));
  const balanceDue = total - amountPaid;

  return {
    lineAmounts,
    subtotal,
    discountAmount,
    taxAmount,
    total,
    amountPaid,
    balanceDue,
  };
}

/**
 * Format a minor-unit amount for display.
 *
 * @param minor  amount in minor units (cents)
 * @param symbol currency prefix, e.g. "HK$" (pass "" to omit)
 * @param dp     decimal places: 2 for documents (legal precision), or omit
 *               trailing ".00" on whole amounts when `dp` is `"auto"`.
 */
export function formatMoney(
  minor: number,
  symbol = "",
  dp: 2 | "auto" = 2,
): string {
  const negative = minor < 0;
  const abs = Math.abs(minor);
  const whole = Math.trunc(abs / 100);
  const cents = abs % 100;

  const groupedWhole = whole.toLocaleString("en-US");
  const showCents = dp === 2 || cents !== 0;
  const body = showCents
    ? `${groupedWhole}.${String(cents).padStart(2, "0")}`
    : groupedWhole;

  return `${negative ? "-" : ""}${symbol}${body}`;
}

/**
 * Runtime guard: assert the computed total is internally consistent.
 * Throws if the numbers don't reconcile — a loud failure beats a wrong invoice.
 */
export function assertConsistent(data: InvoiceData, totals: InvoiceTotals): void {
  const summed = totals.lineAmounts.reduce((a, b) => a + b, 0);
  if (summed !== totals.subtotal) {
    throw new Error(
      `Invoice ${data.number}: line amounts sum to ${summed} but subtotal is ${totals.subtotal}`,
    );
  }
  const expectedTotal = totals.subtotal - totals.discountAmount + totals.taxAmount;
  if (expectedTotal !== totals.total) {
    throw new Error(
      `Invoice ${data.number}: total ${totals.total} != subtotal−discount+tax ${expectedTotal}`,
    );
  }
  if (totals.total - totals.amountPaid !== totals.balanceDue) {
    throw new Error(
      `Invoice ${data.number}: balance due ${totals.balanceDue} != total−paid`,
    );
  }
}
