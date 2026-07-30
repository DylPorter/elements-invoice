/**
 * Totals — subtotal → discount → tax → total → (deposit) → balance due.
 *
 *  email/web : a soft grey panel, right-aligned figures.
 *  document  : a right-hand column block (~55% width) with a 2px ink rule above
 *              the total, the classic filed-invoice look. 2dp everywhere.
 *
 * Reads figures straight from `InvoiceTotals` — this section never does math.
 */
import { Column, ColumnLayouts, Paragraph, Row } from "@unlayer/react-elements";
import type { ReactElement } from "react";
import { formatMoney } from "../compute.js";
import { theme } from "../theme.js";
import type { InvoiceData, InvoiceTotals, RenderMode } from "../types.js";
import { pad } from "../ui.js";

interface TotalLine {
  label: string;
  value: string;
  strong?: boolean;
  rule?: boolean;
}

export function totals(
  data: InvoiceData,
  t: InvoiceTotals,
  mode: RenderMode,
): ReactElement[] {
  const dp = mode === "document" ? 2 : "auto";
  const sym = data.currencySymbol;
  const money = (n: number) => formatMoney(n, sym, dp);

  const lines: TotalLine[] = [{ label: "Subtotal", value: money(t.subtotal) }];
  if (t.discountAmount > 0) {
    const label = data.discount?.label ?? "Discount";
    lines.push({ label, value: `&minus;${money(t.discountAmount)}` });
  }
  if (t.taxAmount > 0 && data.tax) {
    lines.push({ label: data.tax.label, value: money(t.taxAmount) });
  }

  const hasDeposit = t.amountPaid > 0;
  // Without a deposit, "Total" is the emphasised line. With one, "Total" is a
  // plain line and "Balance due" becomes the emphasised bottom line.
  lines.push({ label: "Total", value: money(t.total), strong: !hasDeposit, rule: true });
  if (hasDeposit) {
    lines.push({ label: "Deposit paid", value: `&minus;${money(t.amountPaid)}` });
    lines.push({ label: "Balance due", value: money(t.balanceDue), strong: true });
  }

  if (mode === "document") return documentTotals(lines);
  return panelTotals(lines, mode);
}

/** email/web: soft grey panel spanning the content width. */
function panelTotals(lines: TotalLine[], mode: RenderMode): ReactElement[] {
  return lines.map((ln, i) => {
    const first = i === 0;
    const cell = {
      padding: ln.strong ? "9px 0 0 0" : "4px 0",
      ...(ln.rule
        ? {
            borderTopWidth: "1px",
            borderTopStyle: "solid",
            borderTopColor: theme.color.border,
          }
        : {}),
    } as const;
    return (
      <Row
        key={`tot-${i}`}
        layout={ColumnLayouts.TwoEqual}
        backgroundColor={theme.color.panel}
        padding={`${first ? 14 : 0}px 40px ${i === lines.length - 1 ? 14 : 0}px 40px`}
      >
        <Column {...cell}>
          <Paragraph
            html={ln.strong ? `<b>${ln.label}</b>` : ln.label}
            fontSize={ln.strong ? theme.size.body : theme.size.small}
            color={ln.strong ? theme.color.ink : theme.color.muted}
            lineHeight="150%"
          />
        </Column>
        <Column {...cell}>
          <Paragraph
            html={`<b>${ln.value}</b>`}
            fontSize={ln.strong ? theme.size.body : theme.size.small}
            color={ln.strong ? theme.color.ink : theme.color.inkSoft}
            textAlign="right"
            lineHeight="150%"
          />
        </Column>
      </Row>
    );
  });
}

/**
 * document: right-hand block, ink rule above the emphasised line.
 * A flat 3-column row (spacer · label · value) — no nested Rows, which Elements
 * does not support inside a Column.
 */
function documentTotals(lines: TotalLine[]): ReactElement[] {
  return lines.map((ln, i) => {
    const cell = {
      padding: ln.strong ? "6px 0 0 0" : "3px 0",
      ...(ln.rule
        ? {
            borderTopWidth: "2px",
            borderTopStyle: "solid",
            borderTopColor: theme.color.ink,
          }
        : {}),
    } as const;
    return (
      <Row
        key={`dtot-${i}`}
        cells={[10, 6, 4]}
        backgroundColor={theme.color.paper}
        padding={`${i === 0 ? 12 : 0}px 0 0 0`}
      >
        <Column>
          <Paragraph html="&nbsp;" fontSize="1px" lineHeight="1px" />
        </Column>
        <Column {...cell}>
          <Paragraph
            html={ln.strong ? `<b>${ln.label}</b>` : ln.label}
            fontSize={ln.strong ? theme.size.body : theme.size.small}
            color={ln.strong ? theme.color.ink : theme.color.muted}
            lineHeight="150%"
          />
        </Column>
        <Column {...cell}>
          <Paragraph
            html={`<b>${ln.value}</b>`}
            fontSize={ln.strong ? theme.size.body : theme.size.small}
            color={theme.color.ink}
            textAlign="right"
            lineHeight="150%"
          />
        </Column>
      </Row>
    );
  });
}
