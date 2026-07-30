/**
 * PaymentBlock — how the reader is meant to act, fitted to what the medium can do.
 *
 *  email    : the pay CTA already lives in the band; here we add only the
 *             "view full invoice / PDF attached" escape hatch.
 *  web      : real actions — a pay button plus bank details in an outlined box.
 *  document : NO buttons — paper can't be clicked. The call to action becomes
 *             the bank details and a payment reference to quote. This is the
 *             clearest single illustration of "fitted to the medium".
 */
import { Button, Column, ColumnLayouts, Paragraph, Row } from "@unlayer/react-elements";
import type { ReactElement } from "react";
import { theme } from "../theme.js";
import type { InvoiceData, RenderMode } from "../types.js";
import { pad } from "../ui.js";

function bankBox(data: InvoiceData, mode: RenderMode): ReactElement | null {
  if (!data.payment?.lines?.length) return null;
  const ref = data.payment.reference ?? data.number;
  const body =
    data.payment.lines.join("<br>") +
    `<br>Reference: <b>${ref}</b>`;
  return (
    <Row
      key="bank"
      layout={ColumnLayouts.OneColumn}
      backgroundColor={theme.color.paper}
      padding={pad(mode, 16, 0)}
    >
      <Column
        padding="11px 13px"
        borderTopWidth="1px"
        borderTopStyle="solid"
        borderTopColor={theme.color.border}
        borderRightWidth="1px"
        borderRightStyle="solid"
        borderRightColor={theme.color.border}
        borderBottomWidth="1px"
        borderBottomStyle="solid"
        borderBottomColor={theme.color.border}
        borderLeftWidth="1px"
        borderLeftStyle="solid"
        borderLeftColor={theme.color.border}
      >
        <Paragraph
          html="PAYMENT DETAILS"
          fontSize={theme.size.label}
          fontWeight={theme.weight.bold}
          color={theme.color.faint}
          letterSpacing={theme.label.letterSpacing}
          lineHeight="100%"
        />
        <Paragraph
          html={body}
          fontSize={theme.size.small}
          color={theme.color.inkSoft}
          lineHeight="170%"
        />
      </Column>
    </Row>
  );
}

export function paymentBlock(data: InvoiceData, mode: RenderMode): ReactElement[] {
  const rows: ReactElement[] = [];

  if (mode === "email") {
    const link = data.webUrl
      ? `<a href="${data.webUrl}" style="color:${theme.color.ink};font-weight:700;text-decoration:none;">View the full invoice online &rarr;</a>`
      : "A PDF copy is attached for your records.";
    rows.push(
      <Row
        key="email-foot"
        layout={ColumnLayouts.OneColumn}
        backgroundColor={theme.color.paper}
        padding={pad("email", 18, 8)}
      >
        <Column>
          <Paragraph html={link} fontSize={theme.size.small} color={theme.color.muted} lineHeight="160%" />
        </Column>
      </Row>,
    );
    return rows;
  }

  if (mode === "web") {
    rows.push(
      <Row
        key="web-actions"
        layout={ColumnLayouts.TwoEqual}
        backgroundColor={theme.color.paper}
        padding={pad("web", 20, 0)}
      >
        <Column>
          {data.payUrl ? (
            <Button
              href={data.payUrl}
              backgroundColor={theme.color.ink}
              color={theme.color.onInk}
              fontSize={theme.size.small}
              fontWeight={theme.weight.bold}
              padding="11px 20px"
              borderRadius="6px"
              textAlign="left"
            >
              Pay now
            </Button>
          ) : (
            <Paragraph html="&nbsp;" fontSize="1px" lineHeight="1px" />
          )}
        </Column>
        <Column>
          <Paragraph html="&nbsp;" fontSize="1px" lineHeight="1px" />
        </Column>
      </Row>,
    );
    const bank = bankBox(data, "web");
    if (bank) rows.push(bank);
    return rows;
  }

  // document
  const bank = bankBox(data, "document");
  if (bank) rows.push(bank);
  return rows;
}
