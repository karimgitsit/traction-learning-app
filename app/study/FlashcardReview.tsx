"use client";

import { useEffect, useMemo, useState } from "react";
import type { Flashcard } from "@/lib/types";
import {
  getCardRow,
  previewIntervals,
  rateCard,
  type RatingValue,
} from "@/lib/srs";

export interface FlashcardWithContext extends Flashcard {
  conceptId: string;
  conceptTitle?: string;
  chapterSlug?: string;
}

const RATINGS: RatingValue[] = ["again", "hard", "good", "easy"];
const RATING_STYLES: Record<RatingValue, string> = {
  again: "border-red-500/40 hover:bg-red-500/10 text-red-300",
  hard: "border-amber-500/40 hover:bg-amber-500/10 text-amber-300",
  good: "border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-300",
  easy: "border-sky-500/40 hover:bg-sky-500/10 text-sky-300",
};

const RATING_LABELS: Record<RatingValue, string> = {
  again: "Again",
  hard: "Hard",
  good: "Good",
  easy: "Easy",
};

const TYPE_LABELS: Record<Flashcard["type"], string> = {
  recognition: "RECOGNITION",
  recall: "RECALL",
  cloze: "CLOZE",
};

/**
 * Reusable flashcard review. Supports:
 * - Browse mode (rating buttons hidden when `mode === 'browse'`)
 * - Review mode (SRS ratings recorded, advance on rating)
 *
 * In review mode, after you rate the last card, calls onComplete().
 */
export default function FlashcardReview({
  cards,
  mode = "review",
  onComplete,
  onAdvance,
  showChapterHint = false,
}: {
  cards: FlashcardWithContext[];
  mode?: "browse" | "review";
  onComplete?: () => void;
  onAdvance?: (index: number) => void;
  showChapterHint?: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [intervals, setIntervals] = useState<
    Record<RatingValue, string> | null
  >(null);
  const [busy, setBusy] = useState(false);

  const card = cards[idx];

  // Load interval previews from current FSRS state when the card changes.
  useEffect(() => {
    let cancelled = false;
    if (!card || mode === "browse") return;
    (async () => {
      try {
        const row = await getCardRow(card.conceptId, card.id);
        if (!cancelled) {
          setIntervals(previewIntervals(card.conceptId, card.id, row));
        }
      } catch {
        // IndexedDB unavailable (e.g. SSR) — skip previews
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [card, mode]);

  const goNext = (emptyDeckHandled = false) => {
    setFlipped(false);
    setIntervals(null);
    if (idx >= cards.length - 1) {
      if (!emptyDeckHandled) onComplete?.();
      return;
    }
    const next = idx + 1;
    setIdx(next);
    onAdvance?.(next);
  };

  const goPrev = () => {
    setFlipped(false);
    setIntervals(null);
    if (idx > 0) {
      setIdx(idx - 1);
      onAdvance?.(idx - 1);
    }
  };

  const handleRate = async (r: RatingValue) => {
    if (!card || busy) return;
    setBusy(true);
    try {
      await rateCard(card.conceptId, card.id, r);
    } catch (e) {
      console.error("rateCard failed", e);
    } finally {
      setBusy(false);
      goNext();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLInputElement
      ) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (mode === "review" && flipped) {
        if (e.key === "1") handleRate("again");
        else if (e.key === "2") handleRate("hard");
        else if (e.key === "3") handleRate("good");
        else if (e.key === "4") handleRate("easy");
      } else if (e.key === "ArrowLeft") {
        goPrev();
      } else if (e.key === "ArrowRight") {
        goNext();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped, idx, mode, card]);

  if (!card) {
    return (
      <div className="text-center text-[13px] text-[var(--muted)] py-10">
        No cards.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-[var(--muted)] mb-2">
        <span className="font-mono">
          {idx + 1} / {cards.length} · {TYPE_LABELS[card.type]}
          {showChapterHint && card.chapterSlug && (
            <span className="ml-2 text-[var(--muted)]/70">
              · {card.chapterSlug}
            </span>
          )}
        </span>
        <div className="flex gap-2">
          <button
            onClick={goPrev}
            disabled={idx === 0}
            className="px-2 py-0.5 rounded border border-[var(--border)] hover:bg-[var(--surface-hover)] disabled:opacity-40"
          >
            ←
          </button>
          <button
            onClick={() => goNext(true)}
            className="px-2 py-0.5 rounded border border-[var(--border)] hover:bg-[var(--surface-hover)]"
          >
            →
          </button>
        </div>
      </div>
      <div
        onClick={() => setFlipped((f) => !f)}
        className="cursor-pointer rounded-md border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition p-5 min-h-[160px] flex items-center justify-center text-center"
      >
        <div className="text-[15px] leading-relaxed max-w-prose">
          {flipped ? (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-2">
                Back
              </div>
              {card.back}
            </div>
          ) : (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-2">
                Front — space to flip
              </div>
              {card.front}
            </div>
          )}
        </div>
      </div>

      {mode === "review" && flipped && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {RATINGS.map((r, i) => (
            <button
              key={r}
              onClick={() => handleRate(r)}
              disabled={busy}
              className={`text-[13px] px-3 py-2 rounded border bg-[var(--surface)] transition disabled:opacity-50 ${RATING_STYLES[r]}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{RATING_LABELS[r]}</span>
                <span className="text-[10px] font-mono text-[var(--muted)]">
                  {i + 1}
                </span>
              </div>
              <div className="text-[10px] text-[var(--muted)] mt-0.5 text-left">
                {intervals ? intervals[r] : "—"}
              </div>
            </button>
          ))}
        </div>
      )}

      {mode === "review" && !flipped && (
        <div className="mt-3 text-[11px] text-[var(--muted)] text-center">
          Think of your answer, then press space to reveal.
        </div>
      )}
    </div>
  );
}
