/**
 * The three entry builders — the heart of the submission.
 *
 * Each returns an `<Email>` / `<Page>` / `<Document>` element DIRECTLY, because
 * `renderToHtml` chooses the document shell from the root element's
 * `displayName` (Email→email, Page→web, Document→document). Wrap the tree in a
 * component of your own and you silently get the web shell — the one real trap
 * in the library, caught in the spike.
 *
 * All three call the same `body(data, mode)`. The ONLY differences between the
 * three artifacts live inside the sections, keyed off `mode` — so this file is
 * the proof that it's one component tree, fitted three ways, not three designs.
 */
import { Column, ColumnLayouts, Document, Email, Page, Paragraph, Row } from "@unlayer/react-elements";
import type { ReactElement } from "react";
import { computeTotals, assertConsistent } from "../compute.js";
import { header } from "../sections/Header.js";
import { parties } from "../sections/Parties.js";
import { lineItems } from "../sections/LineItems.js";
import { totals } from "../sections/Totals.js";
import { paymentBlock } from "../sections/PaymentBlock.js";
import { theme } from "../theme.js";
import type { InvoiceData, RenderMode } from "../types.js";
import { labelRow, pad, SANS, spacer } from "../ui.js";

/** Shared composition — identical section order for every mode. */
function body(data: InvoiceData, mode: RenderMode): ReactElement[] {
  const t = computeTotals(data);
  assertConsistent(data, t); // loud failure beats a wrong invoice

  const rows: ReactElement[] = [
    ...header(data, t, mode),
    ...parties(data, mode),
  ];

  if (mode === "web") rows.push(labelRow("lbl-details", "DETAILS", mode));
  rows.push(...lineItems(data, t, mode));
  rows.push(spacer("sp-1", mode, 6));
  rows.push(...totals(data, t, mode));
  rows.push(...paymentBlock(data, mode));

  if (data.notes && mode !== "email") {
    rows.push(
      <Row
        key="notes"
        layout={ColumnLayouts.OneColumn}
        backgroundColor={theme.color.paper}
        padding={pad(mode, 18, 8)}
      >
        <Column>
          <Paragraph
            html={data.notes}
            fontSize={theme.size.small}
            color={theme.color.muted}
            lineHeight="170%"
          />
        </Column>
      </Row>,
    );
  }

  // document: a page-foot line, the small furniture that makes a PDF read as
  // a filed record rather than a screenshot.
  if (mode === "document") {
    rows.push(
      <Row
        key="doc-foot"
        layout={ColumnLayouts.OneColumn}
        backgroundColor={theme.color.paper}
        padding={pad("document", 22, 0)}
      >
        <Column
          padding="8px 0 0 0"
          borderTopWidth="1px"
          borderTopStyle="solid"
          borderTopColor={theme.color.hairline}
        >
          <Paragraph
            html={`${data.from.name} &middot; Invoice #${data.number} &middot; Page 1 of 1`}
            fontSize={theme.size.tiny}
            color={theme.color.faint}
            textAlign="center"
            lineHeight="140%"
          />
        </Column>
      </Row>,
    );
  }

  return rows;
}

export function invoiceEmail(data: InvoiceData): ReactElement {
  return (
    <Email
      backgroundColor="#e9edf1"
      contentWidth={theme.contentWidth.email}
      fontFamily={SANS}
      textColor={theme.color.ink}
      previewText={`Invoice #${data.number} from ${data.from.name}`}
    >
      {body(data, "email")}
    </Email>
  );
}

export function invoicePage(data: InvoiceData): ReactElement {
  return (
    <Page backgroundColor="#eef1f5" contentWidth={theme.contentWidth.web} fontFamily={SANS} textColor={theme.color.ink}>
      {body(data, "web")}
    </Page>
  );
}

export function invoiceDocument(data: InvoiceData): ReactElement {
  return (
    <Document backgroundColor={theme.color.paper} contentWidth={theme.contentWidth.document} fontFamily={SANS} textColor={theme.color.ink}>
      {body(data, "document")}
    </Document>
  );
}

/** Convenience map used by the render script. */
export const builders = {
  email: invoiceEmail,
  web: invoicePage,
  document: invoiceDocument,
} as const;
