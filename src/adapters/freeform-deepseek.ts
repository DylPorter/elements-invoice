/**
 * Freeform → line items, via DeepSeek. **OPTIONAL. OFF THE CRITICAL PATH.**
 *
 * Turns a sentence a contractor would actually type —
 *   "api work tues–thurs, ~14h, plus the logo redesign flat 5k"
 * — into a draft `LineItem[]` for a human to review before sending.
 *
 * Why this is deliberately fenced off:
 *  • An invoice is a legal document. LLM output is non-deterministic, so it
 *    must never be trusted unreviewed — hence this returns *draft* items and
 *    the render pipeline never calls it.
 *  • DeepSeek is used because it's cheap and OpenAI-compatible, so this is a
 *    zero-dependency drop-in: plain `fetch`, no SDK. Set `DEEPSEEK_API_KEY`.
 *
 * Everything downstream still goes through the same `InvoiceData` boundary, so
 * nothing about this file couples to the rest of the system.
 */
import type { LineItem } from "../types.js";

const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";
const MODEL = "deepseek-chat";

export interface FreeformOptions {
  /** Rate to attach to hourly lines, in minor units (e.g. 30000 = 300.00). */
  defaultRate: number;
  /** Minor units per major unit; 100 for cents. Used to scale "5k" → 500000. */
  minorPerMajor?: number;
  apiKey?: string;
  signal?: AbortSignal;
}

/** Shape the model is asked to return (amounts in MAJOR units — we scale). */
interface DraftItem {
  kind: "hourly" | "fixed";
  description: string;
  hours?: number;
  amountMajor?: number;
}

const SYSTEM_PROMPT =
  "You convert a freelancer's freeform note about work done into invoice line " +
  "items. Return json only, matching: " +
  '{"items":[{"kind":"hourly","description":"...","hours":12},' +
  '{"kind":"fixed","description":"...","amountMajor":5000}]}. ' +
  "Use kind 'hourly' with an hours number when the note gives time, and kind " +
  "'fixed' with amountMajor (in the major currency unit, e.g. 5000 for '5k') " +
  "when it gives a flat fee. Do not invent rates. Keep descriptions concise.";

/**
 * Draft line items from freeform text. Async + network; never on the render
 * path. Throws if `DEEPSEEK_API_KEY` is absent or the response can't be parsed.
 */
export async function draftLineItemsFromText(
  text: string,
  opts: FreeformOptions,
): Promise<LineItem[]> {
  const apiKey = opts.apiKey ?? process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error(
      "draftLineItemsFromText: no API key. Set DEEPSEEK_API_KEY or pass opts.apiKey. " +
        "This adapter is optional — the render pipeline never calls it.",
    );
  }
  const minorPerMajor = opts.minorPerMajor ?? 100;

  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 1024,
    }),
    signal: opts.signal,
  });

  if (!res.ok) {
    throw new Error(`DeepSeek request failed: ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek returned no content");

  const parsed = JSON.parse(content) as { items?: DraftItem[] };
  if (!Array.isArray(parsed.items)) throw new Error("DeepSeek JSON missing 'items' array");

  return parsed.items.map((it): LineItem => {
    if (it.kind === "hourly") {
      return {
        kind: "hourly",
        description: it.description,
        hours: Number(it.hours ?? 0),
        rate: opts.defaultRate,
      };
    }
    return {
      kind: "fixed",
      description: it.description,
      amount: Math.round(Number(it.amountMajor ?? 0) * minorPerMajor),
    };
  });
}
