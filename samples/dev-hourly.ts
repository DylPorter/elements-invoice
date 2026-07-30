import type { InvoiceData } from "../src/types.js";

/**
 * Persona 1 — a freelance developer billing hourly, with one fixed line.
 * Fictional studio + client; HKD; deliberately mirrors the shape of a real
 * timesheet export (date/description/hours) run through the CSV adapter.
 */
export const devHourly: InvoiceData = {
  number: "2026-047",
  issueDate: "2026-07-12",
  dueDate: "2026-07-26",
  currency: "HKD",
  currencySymbol: "HK$",
  from: {
    name: "Aperture Studio",
    lines: ["Hong Kong SAR", "BR 7712 3456"],
    email: "billing@aperture.example",
  },
  billTo: {
    name: "Northwind Coffee Ltd",
    lines: ["Accounts Payable", "Central, Hong Kong"],
  },
  lineItems: [
    { kind: "hourly", description: "Discovery workshop & scoping", hours: 12, rate: 30000 },
    { kind: "fixed", description: "Design system build (flat fee)", amount: 800000 },
    { kind: "hourly", description: "Front-end integration", hours: 18.5, rate: 30000 },
  ],
  payment: {
    lines: ["Bank transfer — HSBC HK", "Acct 000-123456-001"],
    reference: "INV-2026-047",
  },
  notes: "Thank you for your business. Payment due within 14 days of the issue date.",
  payUrl: "https://pay.aperture.example/2026-047",
  webUrl: "https://aperture.example/i/2026-047",
};
