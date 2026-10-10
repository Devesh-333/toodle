import type { Category, ModernCategory, LegacyCategory, Question, ValidationReport } from "./types";

export const categories: ModernCategory[] = [
  "Micro-SaaS / B2B Web App",
  "AI Tool / Agent / Workflow",
  "Mobile App (iOS / Android)",
  "Curated Directory / Database",
  "Marketplace / Platform",
  "Paid Community / Membership",
  "E-Commerce / Digital Product",
  "Something Else / Experimental",
];

export const legacyCategories: LegacyCategory[] = ["SaaS", "Mobile App", "Marketplace", "Hardware", "Service", "Other"];

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (
    (categories as string[]).includes(value) ||
    (legacyCategories as string[]).includes(value)
  );
}
const stringsSchema = { type: "array", items: { type: "string" } } as const;
export const questionsSchema = {
  type: "array",
  items: { type: "object", properties: { question: { type: "string" }, options: stringsSchema }, required: ["question", "options"] },
} as const;
export const reportSchema = {
  type: "object",
  properties: {
    overallScore: { type: "integer" }, verdict: { type: "string" }, limitations: { type: "string" }, evidenceSummary: { type: "string" },
    selectedEvidenceIds: stringsSchema,
    sections: { type: "array", items: { type: "object", properties: {
      title: { type: "string" }, score: { type: "integer" }, summary: { type: "string" },
      bullets: stringsSchema, signals: stringsSchema,
    }, required: ["title", "score", "summary", "bullets"] } },
    nextSteps: stringsSchema,
  },
  required: ["overallScore", "verdict", "limitations", "evidenceSummary", "selectedEvidenceIds", "sections", "nextSteps"],
} as const;
export function parseQuestions(value: unknown): Question[] {
  if (!Array.isArray(value) || value.length < 5 || value.length > 7) throw new Error("The AI returned an unexpected question set. Please try again.");
  return value.map((item) => {
    const q = item as Partial<Question>;
    if (typeof q.question !== "string" || !q.question.trim() || !Array.isArray(q.options) || q.options.length !== 4 || q.options.some((o) => typeof o !== "string")) throw new Error("The AI returned an unexpected question set. Please try again.");
    return { question: q.question.trim(), options: q.options.map((o) => o.trim()) };
  });
}
export function parseReport(value: unknown): Omit<ValidationReport, "id" | "createdAt"> {
  const data = value as Partial<ValidationReport>;
  if (!data || typeof data !== "object" || typeof data.overallScore !== "number" || data.overallScore < 1 || data.overallScore > 10 || typeof data.verdict !== "string" || typeof data.evidenceSummary !== "string" || !Array.isArray(data.selectedEvidenceIds) || data.selectedEvidenceIds.length > 3 || data.selectedEvidenceIds.some((id) => typeof id !== "string") || !Array.isArray(data.sections) || data.sections.length !== 5 || !Array.isArray(data.nextSteps) || data.nextSteps.length !== 3) throw new Error("The AI returned an incomplete report. Please try again.");
  for (const section of data.sections) if (!section || typeof section.title !== "string" || typeof section.score !== "number" || section.score < 1 || section.score > 10 || !Array.isArray(section.bullets) || typeof section.summary !== "string") throw new Error("The AI returned an incomplete report. Please try again.");
  return data as Omit<ValidationReport, "id" | "createdAt">;
}
