"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Concept, Scenario } from "@/lib/types";
import FlashcardReview from "./FlashcardReview";

// ───────────────────────────────────────── Section wrapper
function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--muted)] font-medium mb-3">
        {label}
      </div>
      {children}
    </section>
  );
}

// ───────────────────────────────────────── Reveal button wrapper
function Reveal({
  label,
  children,
  initialOpen = false,
}: {
  label: string;
  children: React.ReactNode;
  initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);
  if (open) return <div>{children}</div>;
  return (
    <button
      onClick={() => setOpen(true)}
      className="text-[13px] px-3 py-2 rounded border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--foreground)] transition"
    >
      {label}
    </button>
  );
}

// ───────────────────────────────────────── Pretest
function Pretest({ prompt, modelAnswer }: { prompt: string; modelAnswer: string }) {
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="space-y-3">
      <div className="text-[15px] leading-relaxed">{prompt}</div>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Take a minute to think and write your answer first…"
        className="w-full min-h-[120px] p-3 text-[14px] rounded-md border border-[var(--border)] bg-[var(--surface)] focus:bg-[var(--background)] resize-y"
      />
      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="text-[13px] px-3 py-1.5 rounded border border-[var(--border)] hover:bg-[var(--surface-hover)]"
        >
          Reveal model answer
        </button>
      ) : (
        <div className="p-4 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[14px] leading-relaxed">
          <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-2">
            Model answer
          </div>
          {modelAnswer}
        </div>
      )}
    </div>
  );
}

// (FlashcardDeck was extracted to ./FlashcardReview — used below in SRS review mode.)

// ───────────────────────────────────────── Scenarios
function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
          Scenario · difficulty {scenario.difficulty}/3
        </div>
      </div>
      <div className="text-[14px] leading-relaxed">
        <div className="mb-2">
          <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Setup ·{" "}
          </span>
          {scenario.setup}
        </div>
        <div className="font-medium">{scenario.question}</div>
      </div>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Work through your answer here…"
        className="w-full min-h-[100px] p-3 text-[14px] rounded-md border border-[var(--border)] bg-[var(--background)] resize-y"
      />
      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="text-[13px] px-3 py-1.5 rounded border border-[var(--border)] hover:bg-[var(--surface-hover)]"
        >
          Reveal model answer + rubric
        </button>
      ) : (
        <div className="space-y-3 pt-2 border-t border-[var(--border)]">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">
              Model answer
            </div>
            <div className="text-[14px] leading-relaxed">
              {scenario.modelAnswer}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">
              Rubric · self-grade
            </div>
            <ul className="text-[13px] space-y-1">
              {scenario.rubric.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-[var(--muted)] mt-[2px]">◇</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────── Teach-back
function Teachback({
  conceptTitle,
  prompt,
  rubric,
}: {
  conceptTitle: string;
  prompt: string;
  rubric: string[];
}) {
  const [answer, setAnswer] = useState("");
  const [showRubric, setShowRubric] = useState(false);
  const [showHandoff, setShowHandoff] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "ok" | "error">("idle");

  const buildPrompt = () =>
    [
      `I'm studying the concept "${conceptTitle}" from the book Traction by Weinberg & Mares.`,
      ``,
      `PROMPT:`,
      prompt,
      ``,
      `MY ANSWER:`,
      answer || "(no answer written yet)",
      ``,
      `RUBRIC — please grade my answer against these criteria, point-by-point:`,
      ...rubric.map((r, i) => `${i + 1}. ${r}`),
      ``,
      `For each criterion, tell me: (a) did I hit it, (b) if partially, what specifically is missing or off, (c) one concrete way to strengthen my answer on that point. End with a single sentence: what's the most important thing I should internalize from this concept that my answer revealed I haven't fully grasped.`,
    ].join("\n");

  const handleGradeClick = async () => {
    try {
      await navigator.clipboard.writeText(buildPrompt());
      setCopyState("ok");
    } catch {
      setCopyState("error");
    }
    setShowHandoff(true);
  };

  const recopy = async () => {
    try {
      await navigator.clipboard.writeText(buildPrompt());
      setCopyState("ok");
    } catch {
      setCopyState("error");
    }
  };

  // Close on Escape
  useEffect(() => {
    if (!showHandoff) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowHandoff(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showHandoff]);

  return (
    <div className="space-y-3">
      <div className="text-[15px] leading-relaxed">{prompt}</div>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Explain it in your own words…"
        className="w-full min-h-[180px] p-3 text-[14px] rounded-md border border-[var(--border)] bg-[var(--surface)] focus:bg-[var(--background)] resize-y"
      />
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setShowRubric((s) => !s)}
          className="text-[13px] px-3 py-1.5 rounded border border-[var(--border)] hover:bg-[var(--surface-hover)]"
        >
          {showRubric ? "Hide rubric" : "Show rubric"}
        </button>
        <button
          onClick={handleGradeClick}
          disabled={!answer.trim()}
          className="text-[13px] px-3 py-1.5 rounded bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Grade in Claude →
        </button>
      </div>
      {showRubric && (
        <div className="p-4 rounded-md bg-[var(--surface)] border border-[var(--border)]">
          <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-2">
            Self-grade rubric
          </div>
          <ul className="text-[13px] space-y-1">
            {rubric.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[var(--muted)] mt-[2px]">◇</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showHandoff && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowHandoff(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--background)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--muted)] font-medium mb-2">
              Two-step hand-off
            </div>
            <h3 className="text-[18px] font-semibold mb-4">Grade in Claude</h3>

            {copyState === "error" ? (
              <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/30 text-[13px]">
                Clipboard access was denied. Click <strong>Copy prompt</strong> below to retry, or copy manually from your answer.
              </div>
            ) : (
              <div className="mb-4 p-3 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[13px]">
                ✓ Your prompt + answer + rubric is on your clipboard.
              </div>
            )}

            <ol className="space-y-3 text-[14px] mb-5">
              <li className="flex gap-3">
                <span className="text-[var(--muted)] font-mono text-[12px] mt-[2px]">1.</span>
                <span>Open a new Claude conversation.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--muted)] font-mono text-[12px] mt-[2px]">2.</span>
                <span>
                  Paste with{" "}
                  <kbd className="px-1.5 py-0.5 text-[12px] rounded border border-[var(--border)] bg-[var(--surface)] font-mono">
                    ⌘V
                  </kbd>{" "}
                  (or{" "}
                  <kbd className="px-1.5 py-0.5 text-[12px] rounded border border-[var(--border)] bg-[var(--surface)] font-mono">
                    Ctrl+V
                  </kbd>
                  ) and send. Claude will grade your answer against the rubric.
                </span>
              </li>
            </ol>

            <div className="flex gap-2 flex-wrap">
              <a
                href="https://claude.ai/new"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  navigator.clipboard
                    .writeText(buildPrompt())
                    .then(() => setCopyState("ok"))
                    .catch(() => setCopyState("error"));
                }}
                className="text-[13px] px-3 py-1.5 rounded bg-[var(--accent)] text-white hover:opacity-90"
              >
                Open claude.ai →
              </a>
              <button
                onClick={recopy}
                className="text-[13px] px-3 py-1.5 rounded border border-[var(--border)] hover:bg-[var(--surface-hover)]"
              >
                {copyState === "error" ? "Copy prompt" : "Copy again"}
              </button>
              <button
                onClick={() => setShowHandoff(false)}
                className="text-[13px] px-3 py-1.5 rounded text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────── Main
export default function ConceptView({ concept }: { concept: Concept }) {
  return (
    <article>
      <header className="mb-8 pb-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-[11px] text-[var(--muted)]">
            {concept.id.toUpperCase()}
          </span>
          {concept.isLandmark && (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)]">
              Landmark
            </span>
          )}
        </div>
        <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight leading-tight">
          {concept.title}
        </h1>
      </header>

      <Section label="Pretest — try before you read">
        <Pretest
          prompt={concept.pretest.prompt}
          modelAnswer={concept.pretest.modelAnswer}
        />
      </Section>

      <Section label={`Lesson · ~${concept.lesson.readingTimeMin} min`}>
        <div className="prose-lesson">
          <ReactMarkdown>{concept.lesson.markdown}</ReactMarkdown>
        </div>
      </Section>

      <Section label="Worked example">
        <div className="space-y-3">
          <div className="p-4 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[14px] leading-relaxed">
            <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-2">
              Setup
            </div>
            {concept.workedExample.setup}
          </div>
          <Reveal label="Reveal walkthrough">
            <div className="p-4 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[14px] leading-relaxed whitespace-pre-line">
              <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-2">
                Walkthrough
              </div>
              {concept.workedExample.walkthrough}
            </div>
          </Reveal>
        </div>
      </Section>

      <Section label="Contrast with a neighbor concept">
        <div className="p-4 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[14px] leading-relaxed">
          <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-2">
            vs. <span className="font-mono">{concept.contrast.neighborConceptId}</span>
          </div>
          {concept.contrast.explanation}
        </div>
      </Section>

      <Section label={`Flashcards · ${concept.flashcards.length}`}>
        <FlashcardReview
          cards={concept.flashcards.map((f) => ({
            ...f,
            conceptId: concept.id,
            conceptTitle: concept.title,
          }))}
          mode="review"
        />
      </Section>

      <Section label={`Scenarios · ${concept.scenarios.length}`}>
        <div className="space-y-4">
          {concept.scenarios.map((s) => (
            <ScenarioCard key={s.id} scenario={s} />
          ))}
        </div>
      </Section>

      <Section label="Teach-back">
        <Teachback
          conceptTitle={concept.title}
          prompt={concept.teachback.prompt}
          rubric={concept.teachback.rubric}
        />
      </Section>
    </article>
  );
}
