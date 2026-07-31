/**
 * Browser preview + export helpers.
 *
 * The whole preview is `renderToHtml(builders[mode](data))` — byte-identical to
 * what the CLI writes to `out/` — dropped into an `<iframe srcdoc>`. No server,
 * no API. `computeTotals` runs inside the builders, so an invalid invoice
 * throws here and we surface it instead of rendering garbage.
 */
import { renderToHtml } from "@unlayer/react-elements";
import { builders } from "../src/entries/invoice.js";
import type { InvoiceData, RenderMode } from "../src/types.js";

export interface RenderOutcome {
  html: string;
  error: string | null;
}

export function renderInvoice(data: InvoiceData, mode: RenderMode): RenderOutcome {
  try {
    return { html: renderToHtml(builders[mode](data)), error: null };
  } catch (e) {
    return { html: "", error: e instanceof Error ? e.message : String(e) };
  }
}

/** Trigger a browser download of a string as a file. */
export function downloadFile(filename: string, contents: string, type = "text/html") {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * "Download PDF" with no backend: open the document-mode HTML in a new window
 * and invoke the browser's print dialog, where the user picks "Save as PDF".
 * This is the honest client-side path — the library renders print-ready HTML;
 * the OS/browser does the actual PDF conversion.
 */
export function printAsPdf(data: InvoiceData) {
  const { html, error } = renderInvoice(data, "document");
  if (error) {
    alert(`Cannot render the document for printing:\n${error}`);
    return;
  }
  // Open the rendered HTML via a blob URL (no document.write) and print it.
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const w = window.open(url, "_blank");
  if (!w) {
    URL.revokeObjectURL(url);
    alert("Pop-up blocked. Allow pop-ups to download the PDF.");
    return;
  }
  w.addEventListener("load", () => {
    w.focus();
    w.print();
    // Revoke after the print dialog has had time to read the document.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  });
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
