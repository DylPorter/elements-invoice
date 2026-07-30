/**
 * Header — the most mode-divergent section, and the clearest demonstration of
 * "one tree, three fitted renders".
 *
 *  email / web : a dark "amount due" band with the balance as the hero and a
 *                pay CTA. Squared in email (Outlook drops radius), rounded on web.
 *  document    : NO dark band. A full-bleed dark band is heavy on printer toner
 *                and streaks on cheap office printers, and accountants print
 *                these. The PDF earns hierarchy from rule weight instead — a
 *                studio masthead on the left, invoice meta on the right, under a
 *                2px ink rule. (Dylan's call; explained in the README.)
 */
import { Button, Column, ColumnLayouts, Heading, Paragraph, Row } from "@unlayer/react-elements";
import type { ReactElement } from "react";
import { formatMoney } from "../compute.js";
import { theme } from "../theme.js";
import type { InvoiceData, InvoiceTotals, RenderMode } from "../types.js";
import { pad } from "../ui.js";

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[(m ?? 1) - 1]} ${y}`;
}

export function header(
  data: InvoiceData,
  totals: InvoiceTotals,
  mode: RenderMode,
): ReactElement[] {
  if (mode === "document") return documentHeader(data);
  return bandHeader(data, totals, mode);
}

/** email + web: dark amount-due band. */
function bandHeader(
  data: InvoiceData,
  totals: InvoiceTotals,
  mode: RenderMode,
): ReactElement[] {
  const rounded = mode === "web";
  const dueLabel = totals.amountPaid > 0 ? "Balance due" : "Amount due";
  const hero = formatMoney(totals.balanceDue, data.currencySymbol, "auto");

  return [
    <Row
      key="band"
      layout={ColumnLayouts.OneColumn}
      backgroundColor={theme.color.ink}
      padding="26px 40px 8px 40px"
      borderRadius={rounded ? "8px 8px 0 0" : "0px"}
    >
      <Column>
        <Paragraph
          html={data.from.name}
          fontSize={theme.size.small}
          fontWeight={theme.weight.bold}
          color={theme.color.onInk}
          letterSpacing="0.04em"
          lineHeight="100%"
        />
        <Paragraph
          html={dueLabel.toUpperCase()}
          fontSize={theme.size.label}
          fontWeight={theme.weight.bold}
          color={theme.color.onInkSoft}
          letterSpacing={theme.label.letterSpacing}
          lineHeight="100%"
        />
      </Column>
    </Row>,
    <Row
      key="hero"
      layout={ColumnLayouts.OneColumn}
      backgroundColor={theme.color.ink}
      padding="2px 40px 0 40px"
    >
      <Column>
        <Heading
          headingType="h1"
          fontSize={theme.size.hero}
          fontWeight={theme.weight.bold}
          color={theme.color.onInk}
          textAlign="left"
          letterSpacing="-0.02em"
          lineHeight="110%"
        >
          {hero}
        </Heading>
        <Paragraph
          html={`Invoice #${data.number} &middot; due ${fmtDate(data.dueDate)}`}
          fontSize={theme.size.small}
          color={theme.color.onInkSoft}
          lineHeight="150%"
        />
      </Column>
    </Row>,
    <Row
      key="cta"
      layout={ColumnLayouts.OneColumn}
      backgroundColor={theme.color.ink}
      padding="14px 40px 26px 40px"
    >
      <Column>
        {data.payUrl ? (
          <Button
            href={data.payUrl}
            backgroundColor={theme.color.accent}
            color={theme.color.accentInk}
            fontSize={theme.size.small}
            fontWeight={theme.weight.bold}
            padding="12px 22px"
            borderRadius={rounded ? "6px" : "2px"}
            textAlign="left"
          >
            Pay this invoice
          </Button>
        ) : (
          <Paragraph html="&nbsp;" fontSize="1px" lineHeight="1px" />
        )}
      </Column>
    </Row>,
  ];
}

/** document: light masthead + invoice meta, under a 2px ink rule. */
function documentHeader(data: InvoiceData): ReactElement[] {
  const ruleCell = {
    padding: "0 0 10px 0",
    borderBottomWidth: "2px",
    borderBottomStyle: "solid",
    borderBottomColor: theme.color.ink,
  } as const;

  return [
    <Row
      key="doc-head"
      layout={ColumnLayouts.TwoEqual}
      backgroundColor={theme.color.paper}
      padding={pad("document", 4)}
    >
      <Column {...ruleCell}>
        <Heading
          headingType="h2"
          fontSize={theme.size.h1}
          fontWeight={theme.weight.bold}
          color={theme.color.ink}
          textAlign="left"
          letterSpacing="-0.01em"
          lineHeight="120%"
        >
          {data.from.name}
        </Heading>
        {data.from.lines?.length ? (
          <Paragraph
            html={data.from.lines.join(" &middot; ")}
            fontSize={theme.size.small}
            color={theme.color.muted}
            lineHeight="150%"
          />
        ) : null}
      </Column>
      <Column {...ruleCell}>
        <Paragraph
          html="INVOICE"
          fontSize={theme.size.body}
          fontWeight={theme.weight.bold}
          color={theme.color.ink}
          textAlign="right"
          letterSpacing="0.08em"
          lineHeight="130%"
        />
        <Paragraph
          html={`#${data.number}<br>Issued ${fmtDate(data.issueDate)}<br>Due ${fmtDate(data.dueDate)}`}
          fontSize={theme.size.small}
          color={theme.color.inkSoft}
          textAlign="right"
          lineHeight="160%"
        />
      </Column>
    </Row>,
  ];
}

export { fmtDate };
