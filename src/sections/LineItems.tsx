/**
 * LineItems — the billed work, as Row+Column (never <Table>).
 *
 * Every mode shows the full breakdown — each hourly line renders
 * "12.0 h × 300" beside its description so the amount is always justified,
 * inbox included. Document additionally gets a column-header row and 2dp.
 */
import { Column, ColumnLayouts, Paragraph, Row } from "@unlayer/react-elements";
import type { ReactElement } from "react";
import { formatMoney } from "../compute.js";
import { theme } from "../theme.js";
import type { InvoiceData, InvoiceTotals, LineItem, RenderMode } from "../types.js";
import { hairline, pad } from "../ui.js";

/** "12.0 h × HK$300" style hint for hourly lines (all modes). */
function rateHint(item: LineItem, symbol: string): string {
  if (item.kind !== "hourly") return item.category ? item.category : "";
  const hrs = Number.isInteger(item.hours) ? `${item.hours}.0` : String(item.hours);
  return `${hrs} h &times; ${formatMoney(item.rate, symbol, "auto")}`;
}

export function lineItems(
  data: InvoiceData,
  totals: InvoiceTotals,
  mode: RenderMode,
): ReactElement[] {
  const rows: ReactElement[] = [];
  const showDetail = true; // every mode shows the per-unit breakdown, inbox included
  const dp = mode === "document" ? 2 : "auto";

  // Document gets a column-header row for legibility as a filed record.
  if (mode === "document") {
    const head = {
      padding: "0 0 5px 0",
      borderBottomWidth: "1px",
      borderBottomStyle: "solid",
      borderBottomColor: theme.color.border,
    } as const;
    rows.push(
      <Row
        key="li-head"
        layout={ColumnLayouts.TwoWideNarrow}
        backgroundColor={theme.color.paper}
        padding={pad(mode, 14)}
      >
        <Column {...head}>
          <Paragraph
            html="DESCRIPTION"
            fontSize={theme.size.label}
            fontWeight={theme.weight.bold}
            color={theme.color.faint}
            letterSpacing={theme.label.letterSpacing}
            lineHeight="100%"
          />
        </Column>
        <Column {...head}>
          <Paragraph
            html="AMOUNT"
            fontSize={theme.size.label}
            fontWeight={theme.weight.bold}
            color={theme.color.faint}
            letterSpacing={theme.label.letterSpacing}
            textAlign="right"
            lineHeight="100%"
          />
        </Column>
      </Row>,
    );
  }

  data.lineItems.forEach((item, i) => {
    const last = i === data.lineItems.length - 1;
    const cell = hairline(last && mode === "email", theme.color.hairlineSoft);
    const hint = showDetail ? rateHint(item, data.currencySymbol) : "";
    const desc = hint
      ? `${item.description} <span style="color:${theme.color.faint}">&nbsp;&mdash;&nbsp;${hint}</span>`
      : item.description;

    rows.push(
      <Row
        key={`li-${i}`}
        layout={ColumnLayouts.TwoWideNarrow}
        backgroundColor={theme.color.paper}
        padding={pad(mode, i === 0 && mode !== "document" ? 14 : 0)}
      >
        <Column {...cell}>
          <Paragraph
            html={desc}
            fontSize={theme.size.small}
            color={theme.color.ink}
            lineHeight="150%"
          />
        </Column>
        <Column {...cell}>
          <Paragraph
            html={`<b>${formatMoney(totals.lineAmounts[i], data.currencySymbol, dp)}</b>`}
            fontSize={theme.size.small}
            color={theme.color.ink}
            textAlign="right"
            lineHeight="150%"
          />
        </Column>
      </Row>,
    );
  });

  return rows;
}
