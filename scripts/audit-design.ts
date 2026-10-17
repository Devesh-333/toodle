import { chromium, devices } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Configure AI model for Midscene
if (process.env.GROQ_API_KEY) {
  process.env.OPENAI_BASE_URL = 'https://api.groq.com/openai/v1';
  process.env.OPENAI_API_KEY = process.env.GROQ_API_KEY;
  process.env.MIDSCENE_MODEL_NAME = 'qwen/qwen3.8-27b';
} else if (!process.env.OPENAI_API_KEY && process.env.GOOGLE_GEMINI_API_KEY) {
  process.env.OPENAI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
  process.env.OPENAI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
  process.env.MIDSCENE_MODEL_NAME = 'gemini-3.8-flash';
}

// Define multi-platform responsive device matrix
const ALL_PLATFORMS = [
  { name: 'Desktop_1440p', viewport: { width: 1440, height: 900 } },
  { name: 'Mobile_iPhone15Pro', ...devices['iPhone 15 Pro'] },
  { name: 'Tablet_iPadPro11', ...devices['iPad Pro 11'] },
];

const targetArg = process.argv.find((a) => a.startsWith('--platform='));
const targetPlatform = targetArg ? targetArg.split('=')[1] : null;
const PLATFORMS = targetPlatform
  ? ALL_PLATFORMS.filter((p) => p.name.toLowerCase().includes(targetPlatform.toLowerCase()))
  : ALL_PLATFORMS;

async function checkServer(url: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    return res.status < 500;
  } catch {
    return false;
  }
}

async function runAntiSlopAudit() {
  // Determine if localhost:3001 or localhost:3000 is active
  let targetUrl = 'http://localhost:3001';
  if (!(await checkServer(targetUrl))) {
    targetUrl = 'http://localhost:3000';
  }

  console.log(`🚀 Starting Midscene.js Autonomous Anti-AI-Slop Visual Audit on ${targetUrl}...`);

  const browser = await chromium.launch({ headless: true });
  const reportPath = path.join(process.cwd(), 'design-audit.json');
  let fullAuditReport: Record<string, any> = {};
  if (fs.existsSync(reportPath)) {
    try {
      fullAuditReport = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    } catch {}
  }

  for (const target of PLATFORMS) {
    console.log(`\n📱 Auditing Platform: ${target.name}...`);
    const context = await browser.newContext(target);
    const page = await context.newPage();

    try {
      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    } catch {
      await page.goto(targetUrl, { waitUntil: 'load' });
    }

    const agent = new PlaywrightAgent(page);

    // 1. Native smooth scroll to trigger animations & lazy-loads without burning tokens
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let total = 0;
        const step = 250;
        const timer = setInterval(() => {
          window.scrollBy(0, step);
          total += step;
          if (total >= document.body.scrollHeight) {
            clearInterval(timer);
            window.scrollTo(0, 0);
            resolve();
          }
        }, 80);
      });
    });
    await page.waitForTimeout(1000);

    // 2. Perform Multimodal Anti-AI-Slop Visual Audit via aiQuery
    console.log(`🔍 Inspecting ${target.name} with AI Vision...`);
    try {
      const auditResult = await agent.aiQuery(`
        {
          platform: "${target.name}",
          designScoreOutOf100: number,
          aiSlopDetected: {
            hasGenericPurpleGradients: boolean,
            hasBoringCards: boolean,
            hasFlatShadows: boolean,
            summary: string
          },
          layoutMistakes: string[],
          recommendedFixes: string[]
        },
        You are an elite Principal Design Director performing a visual design audit.
        Critique the rendered visual screenshot against high-craft human design principles:
        1. Eliminate AI Slop: Flag monotonous purple/indigo glows on plain dark backgrounds.
        2. Multi-Layered Lighting: Require 3-layer chiseled rim highlights instead of generic flat shadows.
        3. Concentric Geometry: Check that outer radius = inner radius + padding.
        4. Typography: Enforce clear editorial hierarchy with generous tracking on labels.
        Provide concise, high-impact recommendations to elevate this UI.
      `);

      fullAuditReport[target.name] = auditResult;
      console.log(`✅ ${target.name} Design Score: ${auditResult?.designScoreOutOf100 ?? 'N/A'}/100`);
    } catch (auditErr: any) {
      console.warn(`⚠️ Audit note for ${target.name}:`, auditErr?.message || auditErr);
      fullAuditReport[target.name] = { error: auditErr?.message || 'Rate limited or skipped' };
    }

    await context.close();

    // Save intermediate progress to JSON
    fs.writeFileSync(reportPath, JSON.stringify(fullAuditReport, null, 2));

    // Pace requests to stay within free-tier token rate limits (7k ITPM)
    console.log('⏳ Cooling down 32s for next viewport...');
    await new Promise((r) => setTimeout(r, 32000));
  }

  await browser.close();

  // Save actionable recommendations to JSON
  fs.writeFileSync(reportPath, JSON.stringify(fullAuditReport, null, 2));

  console.log(`\n🎉 Multi-Platform Audit Complete!`);
  console.log(`📄 Actionable Tailwind fixes saved to: ${reportPath}`);
  console.log(`📊 Interactive visual HTML report generated in: ./midscene_report/index.html`);
}

runAntiSlopAudit().catch(console.error);
