"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Chapter } from "@/lib/types";
import ConceptView from "./ConceptView";
import ReflectionPrompt from "./ReflectionPrompt";

export default function StudyFlow({
  chapter,
  allChapters,
  initialIndex = 0,
}: {
  chapter: Chapter;
  allChapters?: Chapter[];
  initialIndex?: number;
}) {
  const concepts = chapter.concepts;
  const [index, setIndex] = useState(initialIndex);
  const [showReflection, setShowReflection] = useState(false);
  const current = concepts[index];

  // Stable session id for this mount (used to group journal entries)
  const sessionId = useMemo(
    () => `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    []
  );

  const goPrev = useCallback(
    () => setIndex((i) => Math.max(0, i - 1)),
    []
  );
  const goNext = useCallback(
    () => setIndex((i) => Math.min(concepts.length - 1, i + 1)),
    [concepts.length]
  );

  // Keyboard shortcuts: [ and ] to move between concepts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLInputElement
      ) {
        return;
      }
      if (e.key === "[") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "]") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goPrev, goNext]);

  // Scroll to top when concept changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [index]);

  const progressPct = useMemo(
    () => ((index + 1) / concepts.length) * 100,
    [index, concepts.length]
  );

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky progress header */}
      <div className="sticky top-12 z-10 bg-[var(--background)]/95 backdrop-blur border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between text-[12px] text-[var(--muted)] mb-2 gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Link
                href={`/chapter/${chapter.slug}`}
                className="hover:text-[var(--foreground)] truncate"
              >
                CH{String(chapter.number).padStart(2, "0")} · {chapter.title}
              </Link>
              {allChapters && allChapters.length > 1 && (
                <select
                  value={chapter.slug}
                  onChange={(e) => {
                    window.location.href = `/study?chapter=${e.target.value}`;
                  }}
                  className="bg-transparent border border-[var(--border)] rounded px-1 py-0.5 text-[11px] hover:bg-[var(--surface-hover)] max-w-[120px]"
                >
                  {allChapters.map((c) => (
                    <option key={c.id} value={c.slug}>
                      CH{String(c.number).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="font-mono shrink-0">
              {index + 1} / {concepts.length}
            </div>
          </div>
          <div className="flex gap-1">
            {concepts.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setIndex(i)}
                className={`h-1 flex-1 rounded-sm transition ${
                  i === index
                    ? "bg-[var(--accent)]"
                    : i < index
                    ? "bg-[var(--foreground)]/60"
                    : "bg-[var(--border)]"
                }`}
                aria-label={`Go to concept ${i + 1}: ${c.title}`}
                title={c.title}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Current concept */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-6 py-8 md:py-12">
        <ConceptView key={current.id} concept={current} />

        {index === concepts.length - 1 && (
          <div className="mt-12 pt-8 border-t border-[var(--border)]">
            {!showReflection ? (
              <button
                onClick={() => setShowReflection(true)}
                className="text-[13px] px-4 py-2 rounded border border-[var(--border)] hover:bg-[var(--surface-hover)]"
              >
                End session with a reflection →
              </button>
            ) : (
              <ReflectionPrompt sessionId={sessionId} />
            )}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="sticky bottom-0 border-t border-[var(--border)] bg-[var(--background)]/95 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={index === 0}
            className="text-[13px] px-3 py-1.5 rounded border border-[var(--border)] hover:bg-[var(--surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Prev <span className="text-[var(--muted)] font-mono">[</span>
          </button>
          <div className="text-[11px] text-[var(--muted)] hidden sm:flex items-center gap-3">
            <span>{Math.round(progressPct)}% through chapter</span>
            <span className="text-[var(--muted)]/60">
              space flip · 1-4 rate · [/] concept
            </span>
          </div>
          <button
            onClick={goNext}
            disabled={index === concepts.length - 1}
            className="text-[13px] px-3 py-1.5 rounded border border-[var(--border)] hover:bg-[var(--surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="text-[var(--muted)] font-mono">]</span> Next →
          </button>
        </div>
      </div>
    </div>
  );
}
