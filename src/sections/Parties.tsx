/**
 * Parties — who's billing whom.
 *
 *  email    : compact — just "Billed to", since the studio name is already in
 *             the dark band. Keeps the inbox render short and focused on paying.
 *  web/doc  : both parties side by side (From / Billed to), the full record.
 */
import { Column, ColumnLayouts, Paragraph, Row } from "@unlayer/react-elements";
import type { ReactElement } from "react";
import { theme } from "../theme.js";
import type { InvoiceData, Party, RenderMode } from "../types.js";
import { pad } from "../ui.js";

function partyBlock(label: string, party: Party, align: "left" | "right"): ReactElement {
  const lines = [party.name, ...(party.lines ?? []), party.email].filter(Boolean);
  return (
    <Column>
      <Paragraph
        html={label.toUpperCase()}
        fontSize={theme.size.label}
        fontWeight={theme.weight.bold}
        color={theme.color.faint}
        letterSpacing={theme.label.letterSpacing}
        textAlign={align}
        lineHeight="100%"
      />
      <Paragraph
        html={lines.join("<br>")}
        fontSize={theme.size.small}
        color={theme.color.inkSoft}
        textAlign={align}
        lineHeight="160%"
      />
    </Column>
  );
}

export function parties(data: InvoiceData, mode: RenderMode): ReactElement[] {
  if (mode === "email") {
    return [
      <Row
        key="parties"
        layout={ColumnLayouts.OneColumn}
        backgroundColor={theme.color.paper}
        padding={pad("email", 20, 4)}
      >
        {partyBlock("Billed to", data.billTo, "left")}
      </Row>,
    ];
  }

  return [
    <Row
      key="parties"
      layout={ColumnLayouts.TwoEqual}
      backgroundColor={theme.color.paper}
      padding={pad(mode, 22, 6)}
    >
      {partyBlock("From", data.from, "left")}
      {partyBlock("Billed to", data.billTo, "right")}
    </Row>,
  ];
}
