# Elements Invoice — Design Spec

**Date:** 2026-07-29
**For:** Unlayer "Build with Elements" Challenge (deadline 2026-07-31)
**Author:** Dylan Porter

## Problem

Freelancers and contractors need the same invoice in three forms: an email the client
receives, a hosted web link they can open, and a PDF everyone files for accounting.
Today that means three tools and three chances for the numbers to disagree.

Unlayer Elements renders one React component tree to email-safe HTML, responsive web,
and print HTML. This project uses that to build **one invoice template, rendered three
ways**, each genuinely fitted to its medium — the thing the library exists to prove.

## Judging criteria (targets)

Originality · design quality · practical value · effective use of Elements · execution.
The differentiator is not "it renders three times" but "each render is deliberately
adapted to its medium, and the README explains every adaptation."

## Scope

### In
- Typed `InvoiceData` contract with an `hourly | fixed` line-item union, optional
  discount, optional tax (configurable label), optional deposit/amount-paid → balance.
- Three composed sections shared across modes; three thin entry files.
- Deterministic `compute.ts` for all money math (never summed inside a component).
- Two adapters behind the boundary: `json` (passthrough + validate),
  `timesheet-csv` (columns `date,description,hours` — the shape of Dylan's existing
  SGPT timesheet Sheet export).
- Three sample personas: dev (hourly), designer (fixed fee), photographer
  (deposit applied + reimbursable expenses).
- `render.ts` emits, per persona × per mode: `.html` for all three, plus `.pdf` for
  document mode via Playwright (headless Chromium print-to-PDF).
- README with the 3×3 render matrix, per-mode rationale, run instructions, screenshots/GIF.

### Out (explicitly)
- No hosted demo / live editor.
- No config-driven "invoice engine" or plugin system (that is the rejected Approach 3).
- No multi-currency engine — all personas bill HKD.
- **No LLM on the critical path.** See Future work.

## Visual direction

"Utility statement" (Stripe/Mercury register). Tokens in `theme.ts`:
- ink `#0d1b2a`, accent `#3ddc97`, warm-neutral rules, tabular numerals.
- Hierarchy from a small type scale + rule weight, not decoration.

## Architecture

```
src/
  types.ts        InvoiceData, LineItem (hourly|fixed), Party, Money, Mode
  theme.ts        design tokens (the C direction, adjustable in one place)
  compute.ts      pure: line items → subtotal, discount, tax, deposit, total, balance
  sections/
    Header.tsx        masthead + invoice meta
    Parties.tsx       from / billed-to
    LineItems.tsx     table; email hides per-unit rate, web/doc show it
    Totals.tsx        subtotal → total → balance due
    PaymentBlock.tsx  email=VML button · web=buttons+bank · doc=bank+reference
  entries/
    InvoiceEmail.tsx     <Email>    mode="email"
    InvoicePage.tsx      <Page>     mode="web"
    InvoiceDocument.tsx  <Document> mode="document"
  adapters/
    json.ts
    timesheet-csv.ts
samples/  dev-hourly.ts  designer-fixed.ts  photographer-expenses.ts
scripts/  render.ts
out/      generated (gitignored); a committed showcase set lives in docs/showcase/
```

Each section is a unit: takes `{ data, mode }`, has one job, is understandable and
testable without reading the others. Entry files are thin — they compose identical
sections inside a different wrapper with a different `mode`. **The architecture states
the thesis:** three ~15-line entries over shared sections shows "three fitted artifacts,"
not "one design rendered thrice."

## Data flow

```
raw input → adapter → InvoiceData (validated) → compute.ts (adds totals)
          → entry composes sections → renderToHtml() → .html
          → [document mode only] Playwright print → .pdf
```

Everything downstream of `InvoiceData` is deterministic. Money is computed once, in
`compute.ts`, and only displayed by components.

## The three modes (per-mode divergence — the README's core content)

| aspect | email | web | document |
|---|---|---|---|
| corners | squared (Outlook drops radius) | radius + shadow | flat |
| detail | summary | full rate breakdown | full + legal (BR#, 2dp) |
| CTA | bulletproof VML button | buttons + bank details | bank details + payment reference |
| header band | dark, `bgcolor`-pinned, dark-mode-safe | dark | **dropped → rule-weight hierarchy** |
| extras | preheader + open-in-browser | responsive, download-PDF | page numbers, repeating header |

**Why the PDF drops the dark band** (Dylan's explicit call, must be explained in README):
a full-bleed dark band is heavy on toner and bands/streaks on cheap office printers,
and accountants print these. The PDF earns hierarchy from rule weight instead — quietly
borrowing Swiss-editorial logic while keeping the C identity everywhere a screen sees it.
Side benefit: it makes the three screenshots visibly distinct, which is the judged axis.

**Email dark mode:** Gmail/Outlook can force-invert. The dark header uses explicit
`bgcolor` + light text chosen to survive inversion; verify in a real client before ship.

## Error handling

- Adapters validate at the boundary and throw actionable errors
  (`"row 4: hours 'abc' is not a number"`) — never render garbage.
- `compute.ts` asserts the displayed total equals the summed line items to the cent.
- `render.ts` fails loud per artifact; a failed PDF step is a clear error, not a silent
  empty file.

## Testing

- `compute.test.ts` — money math: hourly/fixed mix, discount, tax, deposit → balance.
  This is the test that matters.
- adapter tests — CSV happy-path + malformed-row errors.
- HTML snapshot tests for the three rendered outputs (catch styling regressions in diff).
- Manual gate: render all three, eyeball in browser + one real email client, print the
  PDF once to confirm no streaking.

## Build order

1. `types.ts`, `theme.ts`, `compute.ts` (+ tests) — the deterministic core.
2. Sections against one sample, web mode first (easiest to eyeball).
3. Three entries + `render.ts` producing HTML.
4. Playwright PDF step for document mode.
5. `json` + `timesheet-csv` adapters (+ tests).
6. Three persona samples → generate the 3×3 matrix.
7. README with rationale, matrix screenshots, GIF; commit showcase outputs.
8. Public repo `DylPorter/elements-invoice`, `#BuiltWithElements` post, submit form.

## Upstream contribution (bonus lever, same weekend)

Elements is young (253★, MIT, pushed 2026-07-20). Real bugs/gaps hit while building
become PRs to `unlayer/elements` — the challenge criteria literally include "support the
Elements repository," and this is the external-OSS-contribution pattern Dylan wants
(genuine, not green-square farming).

## Future work (documented, not built)

**Freeform → line items via DeepSeek.** An optional adapter behind the same
`InvoiceData` boundary that turns notes ("api work tues–thurs ~14h, plus logo redesign
flat 5k") into a draft `LineItem[]` for human review. DeepSeek chosen for cost and an
OpenAI-compatible API — a drop-in `adapters/freeform-deepseek.ts` that never sits on the
critical path (an invoice is a legal document; nondeterministic math is unacceptable
unreviewed). Deliberately deferred so design quality — the judged axis — gets the hours.

## Constraints / notes

- Repo: new public `DylPorter/elements-invoice`; local at `~/Documents/Programming/elements-invoice`.
- Public repo → **all data fictional.** No real client names, no real rate, no SGPT/BuyHive specifics.
- Node 22 / pnpm; `@unlayer/react-elements` is the core dependency.
