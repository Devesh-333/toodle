"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, ArrowUpRight, BarChart3, Check, Coins, Download, FileText, Hammer, Search, Swords, type LucideIcon } from "lucide-react";
import type { ValidationReport } from "@/lib/types";
import { useFadeIn } from "@/components/useFadeIn";
import { PixelBulb } from "@/components/PixelBulb";

const icons: LucideIcon[] = [Search, BarChart3, Swords, Coins, Hammer];
function decodeReport(hash: string): ValidationReport | null {
  if (!hash || hash.length < 2) return null;
  try {
    const raw = decodeURIComponent(hash.slice(1));
    return JSON.parse(decodeURIComponent(escape(atob(raw)))) as ValidationReport;
  } catch {
    try {
      const raw = decodeURIComponent(hash.slice(1));
      return JSON.parse(atob(raw)) as ValidationReport;
    } catch {
      return null;
    }
  }
}
function cleanHtmlText(value: string) {
  const document = new DOMParser().parseFromString(value, "text/html");
  document.querySelectorAll("script,style,template,noscript").forEach((node) => node.remove());
  const blockTags = new Set(["P", "DIV", "LI", "UL", "OL", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "PRE"]);
  const textParts: string[] = [];
  const visit = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) { textParts.push(node.textContent ?? ""); return; }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const element = node as HTMLElement;
    const isBlock = blockTags.has(element.tagName);
    if (isBlock || element.tagName === "BR") textParts.push(" ");
    element.childNodes.forEach(visit);
    if (isBlock) textParts.push(" ");
  };
  document.body.childNodes.forEach(visit);
  return textParts.join("").replace(/\s+/g, " ").trim();
}
function tone(score: number) { return score <= 3 ? "#EF4444" : score <= 6 ? "#F59E0B" : score <= 9 ? "#10B981" : "#FACC15"; }
function verdictLabel(score: number) { return score <= 3 ? "Needs major rethinking" : score <= 6 ? "Promising, with work to do" : score <= 9 ? "Strong potential" : "Exceptional potential"; }

export default function ReportPage() {
  const params = useParams<{ id: string }>();
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [displayedScore, setDisplayedScore] = useState(0);
  const [open, setOpen] = useState<number[]>([0]);
  const [copied, setCopied] = useState(false);
  const [completedMoves, setCompletedMoves] = useState<number[]>([]);

  function toggleMove(moveIndex: number) {
    setCompletedMoves((prev) =>
      prev.includes(moveIndex) ? prev.filter((i) => i !== moveIndex) : [...prev, moveIndex]
    );
  }
  useFadeIn(report ? "report-ready" : "report-loading");
  useEffect(() => {
    const reportId = params?.id;
    const urlReport = decodeReport(window.location.hash);
    if (urlReport) {
      setReport(urlReport);
      if (reportId) {
        try { localStorage.setItem(`ideaprobe:${reportId}`, JSON.stringify(urlReport)); } catch { /* storage can be unavailable */ }
      }
      return;
    }
    if (reportId) {
      try { const stored = localStorage.getItem(`ideaprobe:${reportId}`); if (stored) setReport(JSON.parse(stored) as ValidationReport); } catch { /* invalid or unavailable storage */ }
    }
  }, [params?.id]);

  useEffect(() => {
    if (!report) return;
    const target = Math.max(0, Math.min(10, report.overallScore));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setDisplayedScore(target); return; }
    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / 1500);
      setDisplayedScore(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [report]);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement("input");
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
    } catch {
      try {
        const input = document.createElement("input");
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      } catch { /* graceful fallback */ }
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2400);
  }

  if (!report) return <div className="shell"><header className="topbar topbar-scrolled"><div className="nav-inner"><Link className="brand" href="/"><span className="brand-mark"><PixelBulb size={22}/></span><span>IdeaProbe</span></Link><Link className="nav-cta" href="/">Validate an idea <ArrowRight size={16} strokeWidth={1.5}/></Link></div></header><main className="main report-error page-enter"><div className="eyebrow" style={{justifyContent:"center"}}>REPORT NOT FOUND</div><h1 className="flow-title" style={{marginTop:18,filter:"url(#headline-inner-shadow-dark)"}}>This link needs its report data.</h1><p className="flow-desc">Open the original share link or start a fresh assessment.</p><Link href="/" className="small-btn" style={{display:"inline-flex",alignItems:"center",gap:8,textDecoration:"none",marginTop:15}}>Validate another idea <ArrowRight size={14} strokeWidth={1.5}/></Link></main></div>;

  const date = new Date(report.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const limitations = /live web research|unverified model|no live sources/i.test(report.limitations) ? "" : report.limitations;
  const evidenceCards = (report.publicEvidence ?? []).slice(0, 3).map((item) => {
    const title = cleanHtmlText(item.title);
    const fullText = cleanHtmlText(item.snippet);
    return { ...item, title, fullText, snippet: fullText.length > 200 ? `${fullText.slice(0, 200).trimEnd()}...` : fullText, truncated: fullText.length > 200 };
  });
  return <div className="shell"><header className="topbar topbar-scrolled"><div className="nav-inner"><Link className="brand" href="/"><span className="brand-mark"><PixelBulb size={22}/></span><span>IdeaProbe</span></Link><Link className="nav-cta" href="/">Validate an idea <ArrowRight size={16} strokeWidth={1.5}/></Link></div></header><main className="main report-wrap page-enter">
    <div className="report-head" data-reveal><div><div className="eyebrow">Idea assessment / {report.category}</div><h1 className="report-title" style={{filter:"url(#headline-inner-shadow-dark)"}}>Your Idea Report</h1><div className="report-date">{date}</div></div><div className="report-actions"><button className="small-btn" onClick={() => void share()}>{copied ? <>Link copied <Check size={14} strokeWidth={1.5}/></> : <>Share report <ArrowUpRight size={14} strokeWidth={1.5}/></>}</button><button className="small-btn" onClick={() => window.print()}>Download PDF <Download size={14} strokeWidth={1.5}/></button></div></div>
    <section className="verdict-panel card" aria-label="Overall score and verdict" data-reveal><div className="score-hud" data-score={report.overallScore} style={{"--score-tone":tone(report.overallScore)} as React.CSSProperties} role="group" aria-label={`Validation score ${report.overallScore} out of 10`}><div className="score-hud-label">VALIDATION SCORE</div><div className="score-frame"><span className="score-number">{displayedScore}</span><span className="score-outof">/ 10</span></div><div className="score-meter" role="img" aria-label={`${report.overallScore} of 10 score blocks filled`}>{Array.from({length:10},(_,i)=><span key={i} className={i < report.overallScore ? "filled" : ""}/>)}</div></div><div><div className="verdict-kicker">Your current read</div><h2 className="verdict-line">{report.verdict}</h2><span className="verdict-label" style={{border:`1px solid ${tone(report.overallScore)}40`,background:`${tone(report.overallScore)}14`,color:tone(report.overallScore)==="#FACC15"?"#92400e":tone(report.overallScore),fontWeight:600}}>{verdictLabel(report.overallScore)}</span></div></section>
    <section className="public-evidence card" data-reveal><div className="evidence-heading"><div className="evidence-title"><span className="pixel-icon-badge"><Search size={17} strokeWidth={1.5}/></span><h2>What Real People Are Saying</h2></div><span className="evidence-count">{evidenceCards.length} sources</span></div>{evidenceCards.length ? <div className="evidence-grid">{evidenceCards.map((item) => <article className="evidence-card card" key={item.id} data-reveal><div className="evidence-meta"><span className="evidence-source-tag">{item.source === "Reddit" ? <><span className="reddit-badge">r/</span><span className="community-name">{item.community ? item.community.replace(/^(r\/|u\/)/i, "") : "SaaS"}</span></> : <><span className="hn-badge">Y</span><span className="community-name">Hacker News</span></>}</span><span className="evidence-kind-tag">{item.kind === "comment" ? "COMMENT" : "ORIGINAL POST"}</span></div><h3>{item.title}</h3><blockquote>“{item.snippet}”</blockquote><div className="evidence-footer"><span className="upvote-count">{item.score != null ? (item.source === "Reddit" ? <><span className="reddit-arrow">▲</span> {item.score.toLocaleString()} upvotes</> : <><span className="hn-arrow">▲</span> {item.score.toLocaleString()} points</>) : "Engagement unavailable"}</span><span className="evidence-links"><a href={item.url} target="_blank" rel="noreferrer">View source <ArrowUpRight size={13} strokeWidth={1.5}/></a>{item.truncated && <a href={item.url} target="_blank" rel="noreferrer">Read more</a>}</span></div></article>)}</div> : <p className="evidence-empty">No matching public discussions were returned for this idea. Try a more specific description to search again.</p>}</section>
    <section className="evidence-summary card" data-reveal><div className="evidence-summary-head"><div className="evidence-title"><span className="pixel-icon-badge"><FileText size={17} strokeWidth={1.5}/></span><h2>Evidence Summary</h2></div><span className="evidence-terminal-tag">[AI SYNTHESIS // EVIDENCE]</span></div><p>{report.evidenceSummary || "Evidence summary is unavailable for reports generated before public evidence was added."}</p></section>
    <div className="step-label report-detail-label" data-reveal>REPORT DETAIL</div>{report.sections?.map((section, i) => { const SectionIcon = icons[i] ?? FileText; const isOpen = open.includes(i); return <section className="report-section card" key={section.title} data-reveal><button className="section-toggle" aria-expanded={isOpen} onClick={() => setOpen((current) => current.includes(i) ? current.filter((n) => n !== i) : [...current, i])}><span className="section-icon" aria-hidden="true"><SectionIcon size={16} strokeWidth={1.5}/></span><span className="section-name">{section.title}</span><span className="section-score">{section.score} / 10</span><span className={`chevron ${isOpen ? "open" : ""}`} aria-hidden="true">⌄</span></button><div className={`section-content ${isOpen ? "section-open" : "section-collapsed"}`}><p style={{marginTop:0}}>{section.summary}</p><ul>{section.bullets?.map((bullet, n) => <li key={n}>{bullet}</li>)}</ul>{section.signals?.map((signal, n) => <div className="signal" key={n}>{signal}</div>)}</div></section>; })}
    <section className="next-steps card" data-reveal><div className="next-steps-header"><div><div className="eyebrow">FOUNDER ACTION PLAN</div><h2>Your Next Three Moves</h2></div><div className="quest-counter"><span className="quest-count">{completedMoves.length} of {report.nextSteps?.length ?? 3}</span> COMPLETED</div></div><div className="quest-list">{report.nextSteps?.map((action, i) => { const isDone = completedMoves.includes(i); return <button key={i} type="button" className={`quest-item ${isDone ? "quest-done" : ""}`} onClick={() => toggleMove(i)}><span className="quest-check-box" aria-hidden="true">{isDone ? "✓" : ""}</span><div className="quest-body"><span className="quest-index">QUEST 0{i + 1}</span><span className="quest-text">{action}</span></div></button>; })}</div></section><div className="report-footer" data-reveal><p className="fine-print">{limitations && `${limitations} `}Use this assessment to guide your next customer conversation.</p><Link href="/" className="small-btn" style={{textDecoration:"none"}}>Validate another idea <ArrowRight size={14} strokeWidth={1.5}/></Link></div>
    {copied && <div className="retro-toast" role="status" aria-live="polite"><span className="toast-dot" aria-hidden="true"/><span className="toast-text">Link copied to clipboard!</span></div>}
  </main></div>;
}
