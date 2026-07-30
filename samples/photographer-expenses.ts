import type { InvoiceData } from "../src/types.js";

/**
 * Persona 3 — a photographer: a fixed day rate, reimbursable expenses
 * (modelled as `fixed` lines tagged `category: "expense"`), and a deposit
 * already paid. Exercises the "Balance due" layout where Total is a plain line
 * and the deposit is subtracted to the emphasised bottom line. Fictional; GBP.
 */
export const photographerExpenses: InvoiceData = {
  number: "2026-118",
  issueDate: "2026-07-20",
  dueDate: "2026-08-03",
  currency: "GBP",
  currencySymbol: "£",
  from: {
    name: "Rowan Vale Photography",
    lines: ["Bristol, UK"],
    email: "studio@rowanvale.example",
  },
  billTo: {
    name: "Harebell Weddings",
    lines: ["On behalf of A. & J. Okafor"],
  },
  lineItems: [
    { kind: "fixed", description: "Wedding day coverage (10 hrs)", amount: 180000 },
    { kind: "fixed", description: "Second shooter", amount: 45000 },
    { kind: "fixed", description: "Prints & album (materials)", amount: 32050, category: "Expense" },
    { kind: "fixed", description: "Travel & accommodation", amount: 18600, category: "Expense" },
  ],
  amountPaid: 100000,
  payment: {
    lines: ["Bank transfer — Monzo", "Sort 04-00-04 · Acct 1234 5678"],
    reference: "2026-118",
  },
  notes: "Deposit received with thanks on 12 May 2026. Final gallery delivered on cleared payment.",
  payUrl: "https://pay.rowanvale.example/2026-118",
  webUrl: "https://rowanvale.example/i/2026-118",
};
