import { askGemini } from "@/lib/gemini";

const GROQ_MODELS = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b"];
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

async function askGroqWithModel(model: string, prompt: string, schema: Record<string, unknown>): Promise<unknown> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not configured.");

  const isArray = schema.type === "array";
  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: `${prompt}\n\nReturn valid JSON matching this schema: ${JSON.stringify(schema)}${isArray ? " Wrap the array in an object with the key items." : ""}` }],
      response_format: { type: "json_object" },
      temperature: 0.4,
    }),
    signal: AbortSignal.timeout(55_000),
  });
  if (!response.ok) throw new Error(`Groq model ${model} failed with HTTP ${response.status}`);

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

async function askGroqCascade(prompt: string, schema: Record<string, unknown>): Promise<unknown> {
  let lastError: Error | null = null;
  for (const model of GROQ_MODELS) {
    try {
      return await askGroqWithModel(model, prompt, schema);
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastError ?? new Error("Groq models unavailable.");
}

export async function askAI<T>(
  prompt: string,
  schema: Record<string, unknown>,
  validate: (value: unknown) => T,
): Promise<T> {
  const hasGroqKey = Boolean(process.env.GROQ_API_KEY);
  const hasGeminiKey = Boolean(process.env.GOOGLE_GEMINI_API_KEY);
  if (!hasGroqKey && !hasGeminiKey) throw new Error("AI_SETUP_REQUIRED");

  // Tier 1 & 2: Groq multi-model cascade (gpt-oss-120b, then qwen3.8-27b)
  if (hasGroqKey) {
    try {
      return validate(await askGroqCascade(prompt, schema));
    } catch (groqErr) {
      console.warn("Groq unavailable, cascading to Gemini:", groqErr instanceof Error ? groqErr.message : groqErr);
    }
  }

  // Tier 3 & 4: Google Gemini resilient dual-pool cascade (gemini-3.8-flash, then gemini-3.5-flash with jitter retries)
  if (hasGeminiKey) {
    try {
      return validate(await askGemini(prompt, schema));
    } catch (geminiErr) {
      console.error("Gemini failed after retry cascade:", geminiErr);
      throw geminiErr;
    }
  }

  throw new Error("AI_UNAVAILABLE");
}
