import type { InvoiceData } from "../src/types.js";

/**
 * Persona 2 — a designer billing a single fixed project fee, with a percentage
 * discount and VAT. Exercises the discount + tax paths and the "no deposit"
 * emphasised-Total layout. Fictional; euros, to show currency is data.
 */
export const designerFixed: InvoiceData = {
  number: "0231",
  issueDate: "2026-07-05",
  dueDate: "2026-07-19",
  currency: "EUR",
  currencySymbol: "€",
  from: {
    name: "Marta Solà — Brand & Type",
    lines: ["Barcelona, ES", "VAT ESB-98123456"],
    email: "hola@martasola.example",
  },
  billTo: {
    name: "Fjord Bicycles",
    lines: ["Marketing Dept", "Oslo, NO"],
  },
  lineItems: [
    { kind: "fixed", description: "Brand identity — full package", amount: 900000 },
    { kind: "fixed", description: "Packaging system (4 SKUs)", amount: 340000 },
  ],
  discount: { kind: "percent", label: "Returning client (10%)", value: 10 },
  tax: { label: "VAT (21%)", rate: 21 },
  payment: {
    lines: ["SEPA transfer", "IBAN ES91 2100 0418 4502 0005 1332"],
    reference: "0231",
  },
  notes: "Two rounds of revisions included. Source files delivered on final payment.",
  payUrl: "https://pay.martasola.example/0231",
  webUrl: "https://martasola.example/i/0231",
};
