"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import FlashcardReview, {
  type FlashcardWithContext,
} from "../FlashcardReview";
import { findDue } from "@/lib/srs";

// Fisher-Yates with a seed so the order is stable per session.
function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  const rand = () => {
    // xorshift32
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (Math.abs(s) % 10_000) / 10_000;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function WarmupClient({
  universe,
}: {
  universe: FlashcardWithContext[];
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "done">("loading");
  const [dueCards, setDueCards] = useState<FlashcardWithContext[]>([]);
  const [limit, setLimit] = useState(10);

  // Seed stable for the life of the mount
  const seed = useMemo(() => Math.floor(Date.now() % 2147483647), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const due = await findDue(universe);
        if (!cancelled) {
          const interleaved = shuffle(due, seed);
          setDueCards(interleaved);
          setStatus("ready");
        }
      } catch (e) {
        console.error("findDue failed", e);
        if (!cancelled) {
          // Fallback: treat everything as due.
          setDueCards(shuffle(universe, seed));
          setStatus("ready");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [universe, seed]);

  const queue = useMemo(
    () => dueCards.slice(0, limit),
    [dueCards, limit]
  );

  if (status === "loading") {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-16 text-center">
        <p className="text-[13px] text-[var(--muted)]">Loading due cards…</p>
      </div>
    );
  }

  if (status === "done" || queue.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-16 text-center">
        <div className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-3">
          Warm-up
        </div>
        <h1 className="text-xl font-semibold mb-2">
          {status === "done" ? "Session complete." : "Nothing due right now."}
        </h1>
        <p className="text-[13px] text-[var(--muted)] mb-6">
          {status === "done"
            ? `You reviewed ${queue.length} card${queue.length === 1 ? "" : "s"}.`
            : "All cards are scheduled for later. Come back after you've studied new material."}
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/study"
            className="text-[13px] px-3 py-2 rounded border border-[var(--border)] hover:bg-[var(--surface-hover)]"
          >
            New material →
          </Link>
          <Link
            href="/"
            className="text-[13px] px-3 py-2 rounded border border-[var(--border)] hover:bg-[var(--surface-hover)]"
          >
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-10">
      <div className="mb-5">
        <Link
          href="/"
          className="text-[12px] text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          ← Dashboard
        </Link>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">
              Warm-up · interleaved review
            </div>
            <h1 className="text-xl font-semibold tracking-tight">
              {queue.length} card{queue.length === 1 ? "" : "s"} due
            </h1>
          </div>
          <div className="text-[11px] text-[var(--muted)]">
            {dueCards.length > limit && (
              <span>
                Showing {limit} of {dueCards.length}.{" "}
                <button
                  onClick={() => setLimit(dueCards.length)}
                  className="text-[var(--accent)] hover:underline"
                >
                  All
                </button>
              </span>
            )}
          </div>
        </div>
      </div>

      <FlashcardReview
        cards={queue}
        mode="review"
        showChapterHint
        onComplete={() => setStatus("done")}
      />

      <div className="mt-6 text-[11px] text-[var(--muted)]">
        Space to flip · 1–4 to rate · ←/→ skip
      </div>
    </div>
  );
}
