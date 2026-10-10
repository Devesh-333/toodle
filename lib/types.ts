export type ModernCategory =
  | "Micro-SaaS / B2B Web App"
  | "AI Tool / Agent / Workflow"
  | "Mobile App (iOS / Android)"
  | "Curated Directory / Database"
  | "Marketplace / Platform"
  | "Paid Community / Membership"
  | "E-Commerce / Digital Product"
  | "Something Else / Experimental";

export type LegacyCategory = "SaaS" | "Mobile App" | "Marketplace" | "Hardware" | "Service" | "Other";

export type Category = ModernCategory | LegacyCategory;
export type Question = { question: string; options: string[] };
export type Answer = { question: string; answer: string };
export type ReportSectionData = { title: string; score: number; summary: string; bullets: string[]; signals?: string[] };
export type PublicEvidenceItem = {
  id: string;
  source: "Reddit" | "Hacker News";
  kind: "post" | "comment";
  title: string;
  snippet: string;
  score: number | null;
  community: string | null;
  url: string;
};
export type ValidationReport = {
  id: string; idea: string; category: Category; createdAt: string; overallScore: number; verdict: string;
  sections: ReportSectionData[]; nextSteps: string[]; limitations: string;
  evidenceSummary?: string;
  publicEvidence?: PublicEvidenceItem[];
  selectedEvidenceIds?: string[];
};
