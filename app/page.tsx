"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Zap,
  Bot,
  Smartphone,
  Database,
  RefreshCw,
  Users,
  Package,
  FlaskConical,
  Sparkles,
} from "lucide-react";
import type { Answer, Category, Question, ValidationReport } from "@/lib/types";
import { categories } from "@/lib/validation";
import { useFadeIn } from "@/components/useFadeIn";
import { PixelBulb } from "@/components/PixelBulb";
import { PixelStar } from "@/components/PixelStar";
import { PixelFrogInteractive } from "@/components/PixelFrogInteractive";
import { PixelSlothInteractive } from "@/components/PixelSlothInteractive";

type Step = "idea" | "questions" | "loading-questions" | "loading-report";
const marks = ["A", "B", "C", "D"];

const FEATURED_PROMPT = {
  label: "Cancellation filler for therapists",
  text: "A micro-SaaS that helps independent mental health therapists automatically fill last-minute appointment cancellations with waitlisted clients.",
};

function getCategoryIcon(cat: Category) {
  switch (cat) {
    case "Micro-SaaS / B2B Web App": return <Zap size={14} strokeWidth={2.2} />;
    case "AI Tool / Agent / Workflow": return <Bot size={14} strokeWidth={2.2} />;
    case "Mobile App (iOS / Android)": return <Smartphone size={14} strokeWidth={2.2} />;
    case "Curated Directory / Database": return <Database size={14} strokeWidth={2.2} />;
    case "Marketplace / Platform": return <RefreshCw size={14} strokeWidth={2.2} />;
    case "Paid Community / Membership": return <Users size={14} strokeWidth={2.2} />;
    case "E-Commerce / Digital Product": return <Package size={14} strokeWidth={2.2} />;
    case "Something Else / Experimental": return <FlaskConical size={14} strokeWidth={2.2} />;
    default: return <Sparkles size={14} strokeWidth={2.2} />;
  }
}

export default function HomePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("idea");
  const [idea, setIdea] = useState("");
  const [category, setCategory] = useState<Category>("Micro-SaaS / B2B Web App");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [otherAnswers, setOtherAnswers] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");
  const [reportPhase, setReportPhase] = useState("Analyzing your idea and answers…");
  const ideaRef = useRef<HTMLTextAreaElement>(null);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  useFadeIn(`${step}-${index}`);

  useEffect(() => {
    if (step !== "idea") return;
    const checkScroll = () => {
      const heroEl = document.getElementById("hero-scene");
      if (!heroEl) {
        setScrolledPastHero(true);
        return;
      }
      const rect = heroEl.getBoundingClientRect();
      setScrolledPastHero(rect.bottom <= 100);
    };
    window.addEventListener("scroll", checkScroll, { passive: true });
    checkScroll();
    return () => window.removeEventListener("scroll", checkScroll);
  }, [step]);

  const isOverHero = step === "idea" && !scrolledPastHero;

  useEffect(() => {
    if (step !== "questions") return;
    const curr = questions[index];
    if (!curr) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= curr.options.length) {
        e.preventDefault();
        selectAnswer(curr.options[num - 1]);
      } else if (e.key.toLowerCase() === "o" || e.key === "5") {
        e.preventDefault();
        selectAnswer("Other");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, questions, index]);

  function scrollToIdeaSection() {
    const el = document.getElementById("idea-section");
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 115;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  }

  function focusIdea() {
    scrollToIdeaSection();
    window.setTimeout(() => ideaRef.current?.focus(), 350);
  }

  function moveHeroPixels(event: MouseEvent<HTMLElement>) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const hero = event.currentTarget;
    const bounds = hero.getBoundingClientRect();
    const pointerX = event.clientX - bounds.left;
    const pointerY = event.clientY - bounds.top;
    hero.dataset.pointerActive = "true";
    hero.style.setProperty("--mouse-x", `${pointerX}px`);
    hero.style.setProperty("--mouse-y", `${pointerY}px`);

    hero.querySelectorAll<HTMLElement>(".pixel-mote").forEach((mote) => {
      const dx = (Number(mote.dataset.x) / 100) * bounds.width - pointerX;
      const dy = (Number(mote.dataset.y) / 100) * bounds.height - pointerY;
      const distance = Math.hypot(dx, dy);
      const force = Math.max(0, 1 - distance / 220) * 12;
      mote.style.setProperty("--mote-x", `${distance ? (dx / distance) * force : 0}px`);
      mote.style.setProperty("--mote-y", `${distance ? (dy / distance) * force : 0}px`);
    });
  }

  function resetHeroPixels(event: MouseEvent<HTMLElement>) {
    const hero = event.currentTarget;
    hero.dataset.pointerActive = "false";
    hero.querySelectorAll<HTMLElement>(".pixel-mote").forEach((mote) => {
      mote.style.setProperty("--mote-x", "0px");
      mote.style.setProperty("--mote-y", "0px");
    });
  }

  async function begin() {
    setError(""); setStep("loading-questions");
    try {
      const response = await fetch("/api/generate-questions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea, category }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not generate questions.");
      setQuestions(data.questions); setAnswers(data.questions.map(() => "")); setOtherAnswers(data.questions.map(() => "")); setIndex(0); setStep("questions");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again."); setStep("idea"); }
  }

  function selectAnswer(value: string) {
    setAnswers((current) => current.map((answer, i) => i === index ? value : answer));
  }

  async function generateReport() {
    setError(""); setReportPhase("Analyzing your idea and answers…"); setStep("loading-report");
    const normalized = answers.map((answer, i) => ({ question: questions[i].question, answer: answer === "Other" ? `Other: ${otherAnswers[i].trim()}` : answer }));
    try {
      const response = await fetch("/api/generate-report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea, category, answers: normalized }) });
      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error ?? "Could not create your report.");
      }
      if (!response.body) throw new Error("The report stream ended unexpectedly. Please try again.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const reports: ValidationReport[] = [];
      const handleEvent = (event: string) => {
        const dataLine = event.split("\n").find((line) => line.startsWith("data:"));
        if (!dataLine) return;
        const message = JSON.parse(dataLine.slice(5).trim()) as { type: string; message?: string; report?: ValidationReport };
        if (message.type === "phase" && message.message) setReportPhase(message.message);
        if (message.type === "error") throw new Error(message.message ?? "Could not create your report.");
        if (message.type === "result" && message.report) reports.push(message.report);
      };
      try {
        while (true) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value, { stream: !done });
          let boundary = buffer.indexOf("\n\n");
          while (boundary >= 0) {
            handleEvent(buffer.slice(0, boundary));
            buffer = buffer.slice(boundary + 2);
            boundary = buffer.indexOf("\n\n");
          }
          if (done) break;
        }
        if (buffer.trim()) handleEvent(buffer);
      } finally { reader.releaseLock(); }
      const report = reports[0];
      if (!report) throw new Error("The report stream ended before the report was ready. Please try again.");
      const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(report)))));
      try { 
        localStorage.setItem(`toodle:${report.id}`, JSON.stringify(report));
        localStorage.setItem(`doodle:${report.id}`, JSON.stringify(report));
        localStorage.setItem(`ideaprobe:${report.id}`, JSON.stringify(report)); 
      } catch { /* private browsing storage can be unavailable */ }
      router.push(`/report/${report.id}#${encoded}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again."); setStep("questions"); }
  }

  const current = questions[index];
  const chosen = answers[index] ?? "";
  const currentAnswer = chosen === "Other" ? (otherAnswers[index] ?? "").trim() : chosen;

  return <div className="shell">
    <header className={`topbar ${isOverHero ? "topbar-over-hero" : "topbar-scrolled"}`}><div className="nav-inner"><a className="brand" href="/"><span className="brand-mark"><PixelBulb size={22}/></span><span>Toodle</span></a>{step === "idea" ? <button className="nav-cta" onClick={scrollToIdeaSection}><span>Validate an idea</span><ArrowRight size={16} strokeWidth={1.5}/></button> : <a className="nav-cta" href="/"><span>Validate an idea</span><ArrowRight size={16} strokeWidth={1.5}/></a>}</div></header>
    <main className={`main page-enter ${step === "idea" ? "home-main" : ""}`}>
      {step === "idea" && <>
        <section className="hero-scene" id="hero-scene" aria-labelledby="hero-title" onMouseMove={moveHeroPixels} onMouseLeave={resetHeroPixels}>
          <div className="pixel-atmosphere" aria-hidden="true"><span className="pixel-cloud pixel-cloud-one"/><span className="pixel-cloud pixel-cloud-two"/><span className="pixel-mote pixel-mote-one" data-x="49" data-y="24"/><span className="pixel-mote pixel-mote-two" data-x="18" data-y="58"/><span className="pixel-mote pixel-mote-three" data-x="71" data-y="43"/></div>
          <PixelSlothInteractive />
          <PixelFrogInteractive />
          <div className="home-grid">
            <div className="hero-copy pixel-particles" data-reveal><span className="eyebrow">Idea validation, grounded in public signals</span><h1 className="headline" id="hero-title"><span className="headline-strong" style={{filter:"url(#headline-inner-shadow-dark)"}}>Validate your startup idea</span><br/><span className="headline-soft" style={{filter:"url(#headline-inner-shadow-light)"}}>before building.</span></h1><p className="intro">A few sharp questions. An honest read on your idea. A practical next step for this week.</p>
              <div className="hero-actions"><button className="glass-button glass-button-primary" onClick={scrollToIdeaSection}>Validate my idea <ArrowRight size={16} strokeWidth={1.5}/></button><a className="glass-button glass-button-secondary" href="#report-preview">Check out live report <ArrowRight size={16} strokeWidth={1.5}/></a></div>
            </div>
          </div>
        </section>
        <section className="idea-input-section" id="idea-section">
          <div className="report-preview" aria-labelledby="preview-title" data-reveal>
            <div className="preview-copy">
              <div className="preview-badge"><span className="preview-badge-dot" />STAGE 01 // CONCEPT PROBE</div>
              <h2 id="preview-title"><span id="report-preview">Validate before you write a single line of code.</span></h2>
              <p>Toodle stress-tests your concept against real market demand, competitor saturation, and willingness-to-pay signals.</p>
              <button className="text-link" onClick={focusIdea}>Start with your idea <ArrowRight size={15} strokeWidth={1.5}/></button>
            </div>
            <section className="form-card hero-form card" aria-labelledby="idea-label" id="idea" data-reveal>
              <div className="form-topline">
                <span className="form-mark" aria-hidden="true"><PixelStar size={14} className="pixel-star-icon" /></span>
                <span>Start with what you know</span>
              </div>
              <label className="field-label" id="idea-label" htmlFor="idea-input">
                What are you thinking of building?
                <span className="counter">
                  {idea.trim() ? `${idea.trim().split(/\s+/).filter(Boolean).length} words` : "0 words"} • {idea.length} chars
                </span>
              </label>
              <textarea
                ref={ideaRef}
                id="idea-input"
                className="idea-input"
                maxLength={25000}
                value={idea}
                onChange={(event) => setIdea(event.target.value)}
                placeholder="A tool that helps independent therapists fill last-minute appointment cancellations…"
              />
              <div className="prompt-starters">
                <span className="starter-label">Try an idea:</span>
                <button
                  type="button"
                  className="starter-chip"
                  onClick={() => { setIdea(FEATURED_PROMPT.text); ideaRef.current?.focus(); }}
                >
                  <span className="starter-chip-icon-box">
                    <Sparkles size={12} strokeWidth={2.2} />
                  </span>
                  <span className="starter-chip-text">{FEATURED_PROMPT.label}</span>
                  <span className="starter-chip-action">Use prompt ↵</span>
                </button>
              </div>
              <label className="field-label" htmlFor="category">Category</label>
              <div className="category-pills-grid" role="radiogroup" aria-label="Select idea category">
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    role="radio"
                    aria-checked={category === item}
                    className={`cat-pill ${category === item ? "cat-pill-active" : ""}`}
                    onClick={() => setCategory(item)}
                  >
                    <span className="cat-pill-icon-box">{getCategoryIcon(item)}</span>
                    <span className="cat-pill-text">{item}</span>
                  </button>
                ))}
              </div>
              <button className="primary-btn" onClick={begin} disabled={idea.trim().length < 15}><span>Start your validation</span><ArrowRight size={16} strokeWidth={1.5}/></button>
              <p className="privacy">Your idea stays private and is only used to create your assessment.</p>
              {error && <div className="error-box" role="alert">{error}<button className="text-btn" onClick={begin}>Try again <ArrowRight size={14} strokeWidth={1.5}/></button></div>}
            </section>
          </div>
        </section>
      </>}

      {step === "loading-questions" && <div className="flow-wrap" data-reveal><div className="step-label">Your idea / Getting the context</div><div className="progress" aria-label="Preparing 6 questions">{Array.from({length:6},(_,i)=><span key={i} className={i===0?"filled":""}/>)}</div><div className="loading-panel card" role="status" aria-live="polite"><div className="loader"/><h2 className="question">Finding the right questions</h2><p className="flow-desc">We’re looking for the details that matter for this idea.</p></div></div>}

      {step === "questions" && current && <div className="flow-wrap" data-reveal><div className="step-label">VALIDATION / YOUR IDEA</div><div className="progress-track-wrap"><div className="progress-frog-mascot" style={{ left: `${(index / Math.max(1, questions.length - 1)) * 92 + 4}%` }}><img src="/pixel-frog-f0.png" width="22" height="20" alt="Frog mascot" /></div><div className="progress" aria-label={`Question ${index + 1} of ${questions.length}`}>{questions.map((_,i)=><span key={i} className={i <= index?"filled":""}/>)}</div></div><h1 className="flow-title" style={{filter:"url(#headline-inner-shadow-dark)"}}>Let’s get specific.</h1><p className="flow-desc">Your answers help make the assessment useful to you, not just the idea on paper.</p><div className="idea-summary card">{idea}</div><div className="step-label question-progress-label">QUESTION {index + 1} OF {questions.length} <span style={{opacity:0.65,fontWeight:400,marginLeft:8}}>• Press 1–4 to answer</span></div><h2 className="question" style={{filter:"url(#headline-inner-shadow-dark)"}}>{current.question}</h2><div className="options" role="radiogroup" aria-label={current.question}>{current.options.map((option, i) => <button key={`q-${index}-opt-${i}-${option}`} role="radio" aria-checked={chosen === option} className={`option ${chosen === option ? "selected" : ""}`} onClick={() => selectAnswer(option)}><span className="option-key-badge">{i + 1}</span><span>{option}</span></button>)}<button role="radio" aria-checked={chosen === "Other"} className={`option ${chosen === "Other" ? "selected" : ""}`} onClick={() => selectAnswer("Other")}><span className="option-key-badge">O</span><span>Something else</span></button></div>{chosen === "Other" && <input autoFocus className="other-input" value={otherAnswers[index] ?? ""} onChange={(event) => setOtherAnswers((currentAnswers) => currentAnswers.map((answer, i) => i === index ? event.target.value.slice(0, 300) : answer))} placeholder="Tell us a little more…" aria-label="Your answer" onKeyDown={(event) => { if (event.key === "Enter" && currentAnswer && index < questions.length - 1) setIndex(index + 1); }}/>}<div className="flow-actions"><button className="text-btn" onClick={() => { setError(""); index === 0 ? setStep("idea") : setIndex(index - 1); }}><ArrowLeft size={14} strokeWidth={1.5}/> Back</button><button className="primary-btn" disabled={!currentAnswer} onClick={() => { setError(""); if (index < questions.length - 1) setIndex(index + 1); else void generateReport(); }}><span>{index < questions.length - 1 ? "Continue" : "Create my assessment"}</span><ArrowRight size={16} strokeWidth={1.5}/></button></div>{error && <div className="error-box" role="alert">{error}<button className="text-btn" onClick={() => void generateReport()}>Try again <ArrowRight size={14} strokeWidth={1.5}/></button></div>}</div>}

      {step === "loading-report" && <div className="flow-wrap" data-reveal><div className="step-label">Your idea / Your assessment</div><div className="progress" aria-label="Analysis complete">{Array.from({length:6},(_,i)=><span key={i} className="filled"/>)}</div><div className="loading-panel card" role="status" aria-live="polite"><div className="loader"/><h2 className="question">{reportPhase}</h2><p className="flow-desc">We’re weighing customer need, market demand, competition, monetization, and feasibility against your answers.</p><p className="source-note">This can take up to a minute. Keep this page open.</p></div></div>}
    </main>
  </div>;
}
