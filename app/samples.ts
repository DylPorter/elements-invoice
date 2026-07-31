import type { InvoiceData } from "../src/types.js";
import { devHourly } from "../samples/dev-hourly.js";
import { designerFixed } from "../samples/designer-fixed.js";
import { photographerExpenses } from "../samples/photographer-expenses.js";

export const SAMPLES: { id: string; label: string; data: InvoiceData }[] = [
  { id: "dev-hourly", label: "Dev — hourly (HKD)", data: devHourly },
  { id: "designer-fixed", label: "Designer — fixed + VAT (EUR)", data: designerFixed },
  { id: "photographer", label: "Photographer — deposit (GBP)", data: photographerExpenses },
];

/** A blank invoice to start from scratch. */
export const BLANK: InvoiceData = {
  number: "0001",
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10),
  currency: "HKD",
  currencySymbol: "HK$",
  from: { name: "Your Studio", lines: ["Your City"] },
  billTo: { name: "Client Name", lines: [] },
  lineItems: [{ kind: "hourly", description: "Work", hours: 1, rate: 30000 }],
  payment: { lines: ["Bank transfer"], reference: "0001" },
};
