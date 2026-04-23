"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/db";

export default function ChapterCompleteButton({
  chapterId,
}: {
  chapterId: string;
}) {
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const row = await db().chapterCompletions.get(chapterId);
        if (!cancelled) setCompleted(!!row);
      } catch (e) {
        console.error("Could not load chapter completion", e);
        if (!cancelled) setCompleted(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chapterId]);

  const toggle = async () => {
    if (completed === null || pending) return;
    setPending(true);
    try {
      if (completed) {
        await db().chapterCompletions.delete(chapterId);
        setCompleted(false);
      } else {
        await db().chapterCompletions.put({
          id: chapterId,
          chapterId,
          completedAt: Date.now(),
        });
        setCompleted(true);
      }
    } catch (e) {
      console.error("Could not update chapter completion", e);
    } finally {
      setPending(false);
    }
  };

  if (completed === null) {
    return (
      <button
        disabled
        className="inline-block text-[13px] px-4 py-2 rounded border border-[var(--border)] opacity-50"
      >
        Loading…
      </button>
    );
  }

  if (completed) {
    return (
      <button
        onClick={toggle}
        disabled={pending}
        className="inline-flex items-center gap-2 text-[13px] px-4 py-2 rounded border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/10 disabled:opacity-50"
      >
        <span aria-hidden>✓</span> Completed · Mark incomplete
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className="inline-block text-[13px] px-4 py-2 rounded border border-[var(--border)] hover:bg-[var(--surface-hover)] disabled:opacity-50"
    >
      Mark chapter complete
    </button>
  );
}
