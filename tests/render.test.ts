import { describe, it, expect } from "vitest";
import { renderToHtml } from "@unlayer/react-elements";
import { builders } from "../src/entries/invoice.js";
import { devHourly } from "../samples/dev-hourly.js";
import { designerFixed } from "../samples/designer-fixed.js";
import { photographerExpenses } from "../samples/photographer-expenses.js";

const personas = { devHourly, designerFixed, photographerExpenses };
const modes = ["email", "web", "document"] as const;

describe("render — every persona × mode produces the right shell", () => {
  for (const [name, data] of Object.entries(personas)) {
    for (const mode of modes) {
      it(`${name} / ${mode}`, () => {
        const html = renderToHtml(builders[mode](data));
        expect(html.length).toBeGreaterThan(1000);

        // The shell is chosen from the root element's displayName. These asserts
        // lock the mode→shell contract that the whole thesis depends on.
        if (mode === "email") {
          expect(html).toContain("XHTML 1.0 Transitional"); // email shell
          expect(html.toLowerCase()).toContain("mso"); // Outlook conditionals
        } else if (mode === "web") {
          expect(html).toContain("<!doctype html>"); // HTML5 shell
        } else {
          expect(html).toContain("XHTML 1.0 Transitional"); // document shell
          expect(html.toLowerCase()).not.toContain("roundrect"); // no VML buttons on paper
        }

        // The computed balance must appear in every render.
        expect(html).toContain(data.currencySymbol);
      });
    }
  }
});

describe("render — mode-specific divergences are present", () => {
  it("email is summary (no per-unit rate hint), web/document show it", () => {
    const email = renderToHtml(builders.email(devHourly));
    const web = renderToHtml(builders.web(devHourly));
    expect(email).not.toContain("&times;");
    expect(web).toContain("h &times;"); // "12.0 h × HK$300"
  });

  it("document has no clickable pay button; email does", () => {
    const email = renderToHtml(builders.email(devHourly));
    const doc = renderToHtml(builders.document(devHourly));
    expect(email).toContain(devHourly.payUrl!);
    expect(doc).not.toContain(devHourly.payUrl!);
    // …but the document still carries the payment reference.
    expect(doc).toContain(devHourly.payment!.reference!);
  });

  it("a deposit invoice shows a Balance due line", () => {
    const doc = renderToHtml(builders.document(photographerExpenses));
    expect(doc).toContain("Balance due");
  });
});
