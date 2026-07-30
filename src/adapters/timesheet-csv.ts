/**
 * Timesheet CSV adapter.
 *
 * Turns a `date,description,hours` CSV — the exact shape of a real timesheet
 * export (the columns Dylan's own invoice script reads off a Google Sheet) —
 * into `InvoiceData`. The CSV carries only the billable lines; everything else
 * (invoice number, dates, parties, rate, currency) is supplied as `meta`.
 *
 * Rows sharing a description are merged and their hours summed, so a week of
 * "API work" scattered across days collapses into one clean line — mirroring
 * the "merged 1-page billing view" step in the source workflow.
 */
import type { InvoiceData, LineItem } from "../types.js";
import { InvoiceValidationError } from "./json.js";

export interface TimesheetMeta {
  number: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  currencySymbol: string;
  from: InvoiceData["from"];
  billTo: InvoiceData["billTo"];
  /** Default hourly rate in minor units (e.g. 30000 = HK$300.00). */
  rate: number;
  payment?: InvoiceData["payment"];
  notes?: string;
  payUrl?: string;
  webUrl?: string;
  /** Merge rows with identical descriptions and sum hours. Default true. */
  mergeByDescription?: boolean;
}

/** Minimal RFC-4180-ish CSV row splitter (handles quoted fields + commas). */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/**
 * @param csv  timesheet CSV. First row may be a header containing "hours";
 *             if so it's skipped. Columns: date, description, hours.
 */
export function fromTimesheetCsv(csv: string, meta: TimesheetMeta): InvoiceData {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) throw new InvoiceValidationError("timesheet CSV is empty");

  // Drop a header row if present. Detected by the header column *naming* the
  // hours field — not merely by it being non-numeric, which would misclassify a
  // lone data row whose hours are malformed (that should error, not vanish).
  const HEADER_HINTS = new Set(["hours", "hrs", "hour", "time", "qty", "quantity"]);
  const first = splitCsvLine(lines[0]);
  const looksLikeHeader =
    first.length >= 3 && HEADER_HINTS.has(first[2].toLowerCase());
  const dataRows = looksLikeHeader ? lines.slice(1) : lines;

  if (dataRows.length === 0) throw new InvoiceValidationError("timesheet CSV has no data rows");

  const merge = meta.mergeByDescription ?? true;
  const order: string[] = [];
  const agg = new Map<string, { description: string; hours: number }>();

  dataRows.forEach((line, idx) => {
    const cols = splitCsvLine(line);
    const rowNo = looksLikeHeader ? idx + 2 : idx + 1;
    if (cols.length < 3)
      throw new InvoiceValidationError(
        `row ${rowNo}: expected 3 columns (date, description, hours), got ${cols.length}`,
      );
    const description = cols[1];
    if (!description)
      throw new InvoiceValidationError(`row ${rowNo}: description is empty`);
    const hours = Number(cols[2]);
    if (!Number.isFinite(hours))
      throw new InvoiceValidationError(`row ${rowNo}: hours "${cols[2]}" is not a number`);
    if (hours < 0)
      throw new InvoiceValidationError(`row ${rowNo}: hours ${hours} is negative`);

    // Merge on the description text; without merge, each row is its own key.
    const key = merge ? description : `${idx} ${description}`;
    const existing = agg.get(key);
    if (existing) {
      existing.hours += hours;
    } else {
      agg.set(key, { description, hours });
      order.push(key);
    }
  });

  const lineItems: LineItem[] = order.map((key) => {
    const entry = agg.get(key)!;
    return { kind: "hourly", description: entry.description, hours: entry.hours, rate: meta.rate };
  });

  return {
    number: meta.number,
    issueDate: meta.issueDate,
    dueDate: meta.dueDate,
    currency: meta.currency,
    currencySymbol: meta.currencySymbol,
    from: meta.from,
    billTo: meta.billTo,
    lineItems,
    payment: meta.payment,
    notes: meta.notes,
    payUrl: meta.payUrl,
    webUrl: meta.webUrl,
  };
}
