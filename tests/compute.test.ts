import { describe, it, expect } from "vitest";
import {
  computeTotals,
  lineAmount,
  formatMoney,
  assertConsistent,
} from "../src/compute.js";
import type { InvoiceData } from "../src/types.js";

const base = (overrides: Partial<InvoiceData>): InvoiceData => ({
  number: "TEST-1",
  issueDate: "2026-07-12",
  dueDate: "2026-07-26",
  currency: "HKD",
  currencySymbol: "HK$",
  from: { name: "Aperture Studio" },
  billTo: { name: "Northwind Coffee" },
  lineItems: [],
  ...overrides,
});

describe("lineAmount", () => {
  it("multiplies hourly lines and rounds to the nearest minor unit", () => {
    expect(lineAmount({ kind: "hourly", description: "x", hours: 12.5, rate: 30000 })).toBe(375000);
  });

  it("rounds fractional-cent hourly results at the line", () => {
    // 0.5 h × 33333 = 16666.5 → 16667
    expect(lineAmount({ kind: "hourly", description: "x", hours: 0.5, rate: 33333 })).toBe(16667);
  });

  it("passes fixed amounts through", () => {
    expect(lineAmount({ kind: "fixed", description: "x", amount: 800000 })).toBe(800000);
  });
});

describe("computeTotals", () => {
  it("sums a mixed hourly + fixed invoice", () => {
    const t = computeTotals(
      base({
        lineItems: [
          { kind: "hourly", description: "Discovery", hours: 12, rate: 30000 }, // 360000
          { kind: "fixed", description: "Design system", amount: 800000 }, // 800000
          { kind: "hourly", description: "Integration", hours: 18.5, rate: 30000 }, // 555000
        ],
      }),
    );
    expect(t.lineAmounts).toEqual([360000, 800000, 555000]);
    expect(t.subtotal).toBe(1715000);
    expect(t.total).toBe(1715000);
    expect(t.balanceDue).toBe(1715000);
  });

  it("applies a percent discount before tax", () => {
    const t = computeTotals(
      base({
        lineItems: [{ kind: "fixed", description: "Project", amount: 1000000 }],
        discount: { kind: "percent", value: 10 }, // -100000
        tax: { label: "VAT (20%)", rate: 20 }, // 20% of 900000 = 180000
      }),
    );
    expect(t.discountAmount).toBe(100000);
    expect(t.taxAmount).toBe(180000);
    expect(t.total).toBe(1080000);
  });

  it("applies a fixed discount", () => {
    const t = computeTotals(
      base({
        lineItems: [{ kind: "fixed", description: "Project", amount: 500000 }],
        discount: { kind: "fixed", value: 50000 },
      }),
    );
    expect(t.discountAmount).toBe(50000);
    expect(t.total).toBe(450000);
  });

  it("caps a discount at the subtotal", () => {
    const t = computeTotals(
      base({
        lineItems: [{ kind: "fixed", description: "Project", amount: 100000 }],
        discount: { kind: "fixed", value: 999999 },
      }),
    );
    expect(t.discountAmount).toBe(100000);
    expect(t.total).toBe(0);
  });

  it("subtracts a deposit to yield balance due", () => {
    const t = computeTotals(
      base({
        lineItems: [{ kind: "fixed", description: "Shoot", amount: 1200000 }],
        amountPaid: 400000,
      }),
    );
    expect(t.total).toBe(1200000);
    expect(t.balanceDue).toBe(800000);
  });

  it("handles the photographer case: expenses + deposit", () => {
    const t = computeTotals(
      base({
        lineItems: [
          { kind: "fixed", description: "Day rate", amount: 900000 },
          { kind: "fixed", description: "Prints", amount: 45050, category: "expense" },
          { kind: "fixed", description: "Travel", amount: 32000, category: "expense" },
        ],
        amountPaid: 300000,
      }),
    );
    expect(t.subtotal).toBe(977050);
    expect(t.balanceDue).toBe(677050);
  });
});

describe("formatMoney", () => {
  it("formats with a symbol and two decimals by default", () => {
    expect(formatMoney(1715000, "HK$")).toBe("HK$17,150.00");
  });
  it("groups thousands", () => {
    expect(formatMoney(123456789, "HK$")).toBe("HK$1,234,567.89");
  });
  it("auto mode drops .00 on whole amounts but keeps real cents", () => {
    expect(formatMoney(1715000, "HK$", "auto")).toBe("HK$17,150");
    expect(formatMoney(1715050, "HK$", "auto")).toBe("HK$17,150.50");
  });
  it("handles negatives (e.g. a credit)", () => {
    expect(formatMoney(-50000, "HK$")).toBe("-HK$500.00");
  });
});

describe("assertConsistent", () => {
  it("passes for a well-formed invoice", () => {
    const data = base({
      lineItems: [{ kind: "fixed", description: "x", amount: 1000 }],
    });
    expect(() => assertConsistent(data, computeTotals(data))).not.toThrow();
  });
  it("throws when a total is tampered with", () => {
    const data = base({ lineItems: [{ kind: "fixed", description: "x", amount: 1000 }] });
    const t = computeTotals(data);
    t.total += 1;
    expect(() => assertConsistent(data, t)).toThrow(/total/);
  });
});
