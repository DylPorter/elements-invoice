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

  // A small index so the outputs are clickable in a browser.
  await writeFile(join(OUT, "index.html"), buildIndex(), "utf8");

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

/** A plain contact-sheet index linking every artifact, for local review. */
function buildIndex(): string {
  const cellFor = (slug: string, mode: RenderMode) => {
    const html = `${slug}.${mode}.html`;
    const pdf = mode === "document" ? ` &nbsp;·&nbsp; <a href="${slug}.pdf">pdf</a>` : "";
    const label = mode === "document" ? "PDF (document)" : mode;
    return `<td><a href="${html}">${label}</a>${pdf}</td>`;
  };
  const rows = PERSONAS.map(
    ({ slug, data }) =>
      `<tr><th>${data.from.name}<br><small>${slug}</small></th>` +
      MODES.map((m) => cellFor(slug, m)).join("") +
      `</tr>`,
  ).join("\n");

  return `<!doctype html>
<meta charset="utf-8">
<title>Elements Invoice — local preview</title>
<style>
  body { font: 15px/1.5 -apple-system, Segoe UI, Roboto, sans-serif; max-width: 760px; margin: 48px auto; padding: 0 20px; color: #0d1b2a; }
  h1 { letter-spacing: -0.02em; } small { color: #6b7a8d; }
  table { border-collapse: collapse; width: 100%; margin-top: 20px; }
  th, td { border: 1px solid #e4e9ef; padding: 12px 14px; text-align: left; vertical-align: top; }
  th { background: #f6f8fa; font-weight: 600; }
  a { color: #0d1b2a; font-weight: 600; } a:hover { color: #1f9d55; }
  thead th { text-transform: uppercase; font-size: 12px; letter-spacing: 0.06em; color: #6b7a8d; }
</style>
<h1>Elements Invoice — local preview</h1>
<p><small>One component tree, three fitted renders. Click any cell. Email views are what an email client receives; document links open the print HTML, with the real PDF beside it.</small></p>
<table>
  <thead><tr><th>Persona</th><th>Email</th><th>Web</th><th>PDF</th></tr></thead>
  <tbody>
${rows}
  </tbody>
</table>`;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
