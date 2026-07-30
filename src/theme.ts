/**
 * Design tokens for the "utility statement" direction (Stripe/Mercury register).
 *
 * Hierarchy comes from a small type scale + rule weight, not decoration. Kept in
 * one place so the whole invoice re-skins from here. Values are plain data —
 * sections read them and pass them to Elements props.
 */
export const theme = {
  color: {
    ink: "#0d1b2a", // near-black brand ink, used for the header band + rules
    inkSoft: "#3d4d5f", // secondary text
    muted: "#6b7a8d", // labels, meta
    faint: "#94a3b5", // in-cell hints (hours, category)
    accent: "#3ddc97", // single high-contrast action colour
    accentInk: "#04231a", // text on the accent
    onInk: "#ffffff", // text on the dark band
    onInkSoft: "#aab8c6", // secondary text on the dark band
    paper: "#ffffff",
    panel: "#f6f8fa", // subtle grey totals panel (web/email)
    hairline: "#e4e9ef", // 1px row separators
    hairlineSoft: "#f1f4f7",
    border: "#d5dde6", // outline boxes on web/document
  },

  font: {
    // System stack — email-safe, no web-font dependency on the critical path.
    sans: "Helvetica Neue, Helvetica, Arial, sans-serif",
    // Tabular figures make the money column line up; monospace guarantees it.
    mono: "'SF Mono', SFMono-Regular, ui-monospace, Menlo, Consolas, monospace",
  },

  size: {
    hero: "26px", // amount-due hero
    h1: "18px",
    body: "13px",
    small: "11px",
    label: "9px", // uppercase section labels
    tiny: "8px", // footer / page furniture
  },

  weight: {
    normal: 400,
    medium: 600,
    bold: 700,
  },

  contentWidth: {
    email: "600px",
    web: "640px",
    document: "720px",
  },

  /** Uppercase label styling reused across sections. */
  label: {
    letterSpacing: "1.2px",
    transform: "uppercase" as const,
  },
} as const;

export type Theme = typeof theme;
