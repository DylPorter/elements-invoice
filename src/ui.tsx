/**
 * Shared building blocks for the invoice sections.
 *
 * Two hard constraints from Elements shape everything here:
 *  1. `Email`/`Page`/`Document` only recognise `<Row>` children — so sections
 *     are *functions that return Rows*, composed inline, never `<Component/>`.
 *  2. `<Table>` renders a bordered spreadsheet; the idiom is `Row` + `Column`
 *     with hairlines drawn on the Column's bottom border.
 */
import { Column, ColumnLayouts, Paragraph, Row } from "@unlayer/react-elements";
import type { ReactElement } from "react";
import { theme } from "./theme.js";
import type { RenderMode } from "./types.js";

/** Elements wants font family as a {label, value} pair, not a bare string. */
export const SANS = { label: "Sans Serif", value: theme.font.sans };

/** Horizontal padding inside the content column, per mode. */
export function pad(mode: RenderMode, top = 0, bottom = 0): string {
  const x = mode === "document" ? 0 : 40;
  return `${top}px ${x}px ${bottom}px ${x}px`;
}

/** A hairline-bottom cell style, reused for line/label rows. */
export function hairline(last = false, color: string = theme.color.hairline) {
  return {
    padding: "11px 0",
    borderBottomWidth: last ? "0px" : "1px",
    borderBottomStyle: "solid",
    borderBottomColor: color,
  } as const;
}

/**
 * A left-label / right-value row (the totals + parties idiom).
 * `strong` bolds and darkens the value (used for the Total line).
 */
export function labelValueRow(
  key: string,
  label: string,
  value: string,
  opts: {
    mode: RenderMode;
    bg?: string;
    strong?: boolean;
    muted?: boolean;
    last?: boolean;
    divider?: boolean;
  },
): ReactElement {
  const cell = opts.divider ? hairline(opts.last) : { padding: "5px 0" };
  return (
    <Row
      key={key}
      layout={ColumnLayouts.TwoEqual}
      backgroundColor={opts.bg ?? theme.color.paper}
      padding={pad(opts.mode)}
    >
      <Column {...cell}>
        <Paragraph
          html={label}
          fontSize={theme.size.small}
          color={opts.muted ? theme.color.muted : theme.color.inkSoft}
          lineHeight="150%"
        />
      </Column>
      <Column {...cell}>
        <Paragraph
          html={opts.strong ? `<b>${value}</b>` : value}
          fontSize={opts.strong ? theme.size.body : theme.size.small}
          color={opts.strong ? theme.color.ink : theme.color.inkSoft}
          textAlign="right"
          lineHeight="150%"
        />
      </Column>
    </Row>
  );
}

/** An uppercase section label row (e.g. "DETAILS", "PAYMENT"). */
export function labelRow(key: string, text: string, mode: RenderMode): ReactElement {
  return (
    <Row
      key={key}
      layout={ColumnLayouts.OneColumn}
      backgroundColor={theme.color.paper}
      padding={pad(mode, 24, 4)}
    >
      <Column>
        <Paragraph
          html={text}
          fontSize={theme.size.label}
          fontWeight={theme.weight.bold}
          color={theme.color.muted}
          letterSpacing={theme.label.letterSpacing}
          lineHeight="100%"
        />
      </Column>
    </Row>
  );
}

/** A full-width spacer row, for deliberate vertical rhythm. */
export function spacer(key: string, mode: RenderMode, height = 16): ReactElement {
  return (
    <Row
      key={key}
      layout={ColumnLayouts.OneColumn}
      backgroundColor={theme.color.paper}
      padding={`${height}px 0 0 0`}
    >
      <Column>
        <Paragraph html="&nbsp;" fontSize="1px" lineHeight="1px" />
      </Column>
    </Row>
  );
}
