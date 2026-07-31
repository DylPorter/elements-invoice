import type { InvoiceData } from "../src/types.js";
import { devHourly } from "../samples/dev-hourly.js";
import { designerFixed } from "../samples/designer-fixed.js";
import { photographerExpenses } from "../samples/photographer-expenses.js";

export const SAMPLES: { id: string; label: string; data: InvoiceData }[] = [
  { id: "dev-hourly", label: "Dev — hourly (HKD)", data: devHourly },
  { id: "designer-fixed", label: "Designer — fixed + VAT (EUR)", data: designerFixed },
  { id: "photographer", label: "Photographer — deposit (GBP)", data: photographerExpenses },
];

/* ---- smart defaults for a fresh invoice ----
   The user should never open to a wall of decisions. Invoice number, currency,
   and dates are all inferred so the "Invoice details" panel can stay closed;
   only Parties and a single Line item are left for them to fill in. */

const CURRENCY_SYMBOLS: Record<string, string> = {
  HKD: "HK$",
  USD: "$",
  EUR: "€",
  GBP: "£",
  SGD: "S$",
  AUD: "A$",
};

// Regions we can map to a supported currency. Eurozone members all → EUR.
const REGION_CURRENCY: Record<string, string> = {
  HK: "HKD",
  US: "USD",
  GB: "GBP",
  SG: "SGD",
  AU: "AUD",
  AT: "EUR", BE: "EUR", CY: "EUR", EE: "EUR", FI: "EUR", FR: "EUR", DE: "EUR",
  GR: "EUR", IE: "EUR", IT: "EUR", LV: "EUR", LT: "EUR", LU: "EUR", MT: "EUR",
  NL: "EUR", PT: "EUR", SK: "EUR", SI: "EUR", ES: "EUR",
};

// Fallback region signal when the locale carries no region subtag (e.g. "en").
const TZ_REGION: Record<string, string> = {
  "Asia/Hong_Kong": "HK",
  "Asia/Singapore": "SG",
  "Europe/London": "GB",
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "America/New_York": "US",
  "America/Los_Angeles": "US",
  "America/Chicago": "US",
};

/** Best-effort currency from the browser's locale, then its time zone. */
export function detectCurrency(): { currency: string; symbol: string } {
  let region: string | undefined;
  try {
    region = new Intl.Locale(navigator.language).region ?? undefined;
  } catch {
    /* Intl.Locale unavailable — fall through to the time-zone guess */
  }
  if (!region) {
    try {
      region = TZ_REGION[Intl.DateTimeFormat().resolvedOptions().timeZone];
    } catch {
      /* ignore */
    }
  }
  const currency = (region && REGION_CURRENCY[region]) || "USD";
  return { currency, symbol: CURRENCY_SYMBOLS[currency] ?? "$" };
}

/** A random-ish invoice number, e.g. "2026-047". */
function randomNumber(): string {
  const year = new Date().getFullYear();
  const n = 100 + Math.floor(Math.random() * 900); // 100–999
  return `${year}-${n}`;
}

/**
 * A fresh invoice: inferred number/currency/dates, empty parties, and exactly
 * one line item. This is what the app opens on and what "Start blank" resets to.
 */
export function freshInvoice(): InvoiceData {
  const { currency, symbol } = detectCurrency();
  const number = randomNumber();
  return {
    number,
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10),
    currency,
    currencySymbol: symbol,
    from: { name: "", lines: [] },
    billTo: { name: "", lines: [] },
    lineItems: [{ kind: "hourly", description: "", hours: 1, rate: 30000 }],
    payment: { lines: [], reference: number },
  };
}
