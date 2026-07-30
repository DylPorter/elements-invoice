import { describe, it, expect } from "vitest";
import { fromJson, fromJsonString, InvoiceValidationError } from "../src/adapters/json.js";
import { fromTimesheetCsv, type TimesheetMeta } from "../src/adapters/timesheet-csv.js";
import { computeTotals } from "../src/compute.js";

const validJson = {
  number: "A-1",
  issueDate: "2026-07-01",
  dueDate: "2026-07-15",
  currency: "HKD",
  currencySymbol: "HK$",
  from: { name: "Studio" },
  billTo: { name: "Client" },
  lineItems: [{ kind: "fixed", description: "Work", amount: 100000 }],
};

describe("fromJson", () => {
  it("accepts a well-formed object", () => {
    const d = fromJson(validJson);
    expect(d.number).toBe("A-1");
    expect(d.lineItems).toHaveLength(1);
  });

  it("round-trips through fromJsonString", () => {
    expect(fromJsonString(JSON.stringify(validJson)).number).toBe("A-1");
  });

  it("rejects a missing required field with a path", () => {
    const bad = { ...validJson, number: undefined };
    expect(() => fromJson(bad)).toThrow(/number/);
  });

  it("rejects an empty lineItems array", () => {
    expect(() => fromJson({ ...validJson, lineItems: [] })).toThrow(/non-empty/);
  });

  it("rejects an unknown line-item kind with a path", () => {
    const bad = { ...validJson, lineItems: [{ kind: "weekly", description: "x", amount: 1 }] };
    expect(() => fromJson(bad)).toThrow(/lineItems\[0\]\.kind/);
  });

  it("rejects a non-numeric amount", () => {
    const bad = { ...validJson, lineItems: [{ kind: "fixed", description: "x", amount: "lots" }] };
    expect(() => fromJson(bad)).toThrow(InvoiceValidationError);
  });

  it("throws on invalid JSON text", () => {
    expect(() => fromJsonString("{not json")).toThrow(/not valid JSON/);
  });
});

const meta: TimesheetMeta = {
  number: "TS-1",
  issueDate: "2026-07-01",
  dueDate: "2026-07-15",
  currency: "HKD",
  currencySymbol: "HK$",
  from: { name: "Studio" },
  billTo: { name: "Client" },
  rate: 30000, // HK$300/h
};

describe("fromTimesheetCsv", () => {
  it("parses rows and applies the default rate", () => {
    const csv = "2026-07-01,Discovery,12\n2026-07-02,Integration,18.5";
    const d = fromTimesheetCsv(csv, meta);
    expect(d.lineItems).toHaveLength(2);
    const t = computeTotals(d);
    expect(t.subtotal).toBe(12 * 30000 + Math.round(18.5 * 30000)); // 360000 + 555000
  });

  it("skips a header row", () => {
    const csv = "date,description,hours\n2026-07-01,Discovery,12";
    expect(fromTimesheetCsv(csv, meta).lineItems).toHaveLength(1);
  });

  it("merges rows with identical descriptions and sums hours", () => {
    const csv = "2026-07-01,API work,6\n2026-07-02,API work,4\n2026-07-03,Meeting,1";
    const d = fromTimesheetCsv(csv, meta);
    expect(d.lineItems).toHaveLength(2);
    const api = d.lineItems.find((l) => l.description === "API work");
    expect(api && api.kind === "hourly" && api.hours).toBe(10);
  });

  it("keeps rows separate when merge is disabled", () => {
    const csv = "2026-07-01,API work,6\n2026-07-02,API work,4";
    const d = fromTimesheetCsv(csv, { ...meta, mergeByDescription: false });
    expect(d.lineItems).toHaveLength(2);
  });

  it("preserves multi-word descriptions", () => {
    const csv = "2026-07-01,Front-end integration work,8";
    const d = fromTimesheetCsv(csv, meta);
    expect(d.lineItems[0].description).toBe("Front-end integration work");
  });

  it("handles quoted fields containing commas", () => {
    const csv = '2026-07-01,"Design, build, ship",5';
    const d = fromTimesheetCsv(csv, meta);
    expect(d.lineItems[0].description).toBe("Design, build, ship");
  });

  it("throws an actionable error on non-numeric hours", () => {
    const csv = "2026-07-01,Discovery,twelve";
    expect(() => fromTimesheetCsv(csv, meta)).toThrow(/hours "twelve" is not a number/);
  });

  it("throws with the right row number after a header", () => {
    const csv = "date,description,hours\n2026-07-01,Good,3\n2026-07-02,Bad,x";
    expect(() => fromTimesheetCsv(csv, meta)).toThrow(/row 3/);
  });

  it("throws on too few columns", () => {
    expect(() => fromTimesheetCsv("2026-07-01,only-two", meta)).toThrow(/expected 3 columns/);
  });
});
