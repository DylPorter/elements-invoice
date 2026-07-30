/**
 * Render pipeline.
 *
 * For every persona × every mode:
 *   • write out/<persona>.<mode>.html  (via Elements renderToHtml)
 *   • document mode also → out/<persona>.pdf (Playwright print-to-PDF)
 *   • write a PNG screenshot for the README (email/web at device widths,
 *     document as a page render)
 *
 * The HTML step is pure Elements. Playwright is used ONLY to turn the
 * print-ready `document` HTML into an actual PDF and to capture screenshots —
 * the library stops at print HTML by design, so the PDF step is ours.
 */
import { mkdir, writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToHtml } from "@unlayer/react-elements";
import { chromium, type Browser } from "playwright";
import { builders } from "../src/entries/invoice.js";
import type { InvoiceData, RenderMode } from "../src/types.js";

import { devHourly } from "../samples/dev-hourly.js";
import { designerFixed } from "../samples/designer-fixed.js";
import { photographerExpenses } from "../samples/photographer-expenses.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "out");
const SHOTS = join(OUT, "screenshots");

const PERSONAS: { slug: string; data: InvoiceData }[] = [
  { slug: "dev-hourly", data: devHourly },
  { slug: "designer-fixed", data: designerFixed },
  { slug: "photographer-expenses", data: photographerExpenses },
];

const MODES: RenderMode[] = ["email", "web", "document"];

/** Viewport width used to screenshot each mode. */
const SHOT_WIDTH: Record<RenderMode, number> = { email: 640, web: 680, document: 800 };

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(SHOTS, { recursive: true });

  // 1. Pure-Elements HTML for every persona × mode.
  const artifacts: { slug: string; mode: RenderMode; html: string; file: string }[] = [];
  for (const { slug, data } of PERSONAS) {
    for (const mode of MODES) {
      const html = renderToHtml(builders[mode](data));
      const file = join(OUT, `${slug}.${mode}.html`);
      await writeFile(file, html, "utf8");
      artifacts.push({ slug, mode, html, file });
    }
  }
  console.log(`✓ wrote ${artifacts.length} HTML files to out/`);

  // 2. Playwright: PDFs (document mode) + screenshots (all modes).
  let browser: Browser | undefined;
  try {
    browser = await chromium.launch();
  } catch (e) {
    console.warn(
      "⚠ Playwright Chromium not available — skipping PDF + screenshots.\n" +
        "  Run `npx playwright install chromium` to enable them.\n" +
        `  (${(e as Error).message.split("\n")[0]})`,
    );
    return;
  }

  try {
    for (const art of artifacts) {
      const page = await browser.newPage({ viewport: { width: SHOT_WIDTH[art.mode], height: 900 } });
      await page.setContent(art.html, { waitUntil: "networkidle" });

      if (art.mode === "document") {
        const pdf = join(OUT, `${art.slug}.pdf`);
        await page.pdf({
          path: pdf,
          format: "A4",
          printBackground: true,
          margin: { top: "14mm", bottom: "14mm", left: "14mm", right: "14mm" },
        });
      }

      await page.screenshot({
        path: join(SHOTS, `${art.slug}.${art.mode}.png`),
        fullPage: true,
      });
      await page.close();
    }
    console.log(`✓ wrote 3 PDFs + ${artifacts.length} screenshots`);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
