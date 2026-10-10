import { askGemini } from "@/lib/gemini";

const GROQ_MODEL = "openai/gpt-oss-120b";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

async function askGroq(prompt: string, schema: Record<string, unknown>): Promise<unknown> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not configured.");

  const isArray = schema.type === "array";
  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: `${prompt}\n\nReturn valid JSON matching this schema: ${JSON.stringify(schema)}${isArray ? " Wrap the array in an object with the key items." : ""}` }],
      response_format: { type: "json_object" },
      temperature: 0.4,
    }),
    signal: AbortSignal.timeout(55_000),
  });
  if (!response.ok) throw new Error("Groq request failed.");

  const body = await response.json() as { choices?: { message?: { content?: string | null } }[] };
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned an empty response.");
  let parsed: unknown;
  try { parsed = JSON.parse(content); } catch { throw new Error("Groq returned invalid JSON."); }
  if (isArray) {
    const items = (parsed as { items?: unknown } | null)?.items;
    if (!Array.isArray(items)) throw new Error("Groq returned an unexpected JSON shape.");
    return items;
  }
  return parsed;
}

export async function askAI<T>(
  prompt: string,
  schema: Record<string, unknown>,
  validate: (value: unknown) => T,
): Promise<T> {
  const hasGroqKey = Boolean(process.env.GROQ_API_KEY);
  const hasGeminiKey = Boolean(process.env.GOOGLE_GEMINI_API_KEY);
  if (!hasGroqKey && !hasGeminiKey) throw new Error("AI_SETUP_REQUIRED");

  if (hasGroqKey) {
    try {
      return validate(await askGroq(prompt, schema));
    } catch {
      // Retry through Gemini below when Groq is unavailable or returns invalid output.
    }
  }
  if (hasGeminiKey) {
    return validate(await askGemini(prompt, schema));
  }
  throw new Error("AI_UNAVAILABLE");
}
