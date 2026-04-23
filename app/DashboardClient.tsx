"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Chapter } from "@/lib/types";
import { dueCount, masteryByConcept } from "@/lib/srs";
import { db } from "@/lib/db";
import type { FlashcardWithContext } from "./study/FlashcardReview";

interface ChapterProgress {
  dueCount: number;
  landmarkMastery: number; // 0-1
  completed: boolean;
}

export default function DashboardClient({
  chapters,
}: {
  chapters: Chapter[];
}) {
  const [stats, setStats] = useState<{
    globalDue: number;
    perChapter: Record<string, ChapterProgress>;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const universe: FlashcardWithContext[] = chapters.flatMap((ch) =>
          ch.concepts.flatMap((c) =>
            c.flashcards.map((f) => ({
              ...f,
              conceptId: c.id,
              conceptTitle: c.title,
              chapterSlug: ch.slug,
            }))
          )
        );

        const globalDue = await dueCount(universe);
        const completions = await db().chapterCompletions.toArray();
        const completedIds = new Set(completions.map((c) => c.chapterId));

        const perChapter: Record<string, ChapterProgress> = {};
        for (const ch of chapters) {
          const chUniverse = universe.filter(
            (u) => u.chapterSlug === ch.slug
          );
          const due = await dueCount(chUniverse);
          const landmarks = ch.concepts.filter((c) => c.isLandmark);
          const mastery = landmarks.length
            ? await masteryByConcept(landmarks.map((c) => c.id))
            : {};
          const avgMastery = landmarks.length
            ? Object.values(mastery).reduce((a, b) => a + b, 0) /
              landmarks.length
            : 0;
          perChapter[ch.id] = {
            dueCount: due,
            landmarkMastery: avgMastery,
            completed: completedIds.has(ch.id),
          };
        }

        if (!cancelled) setStats({ globalDue, perChapter });
      } catch (e) {
        console.error("dashboard stats failed", e);
        if (!cancelled) setStats({ globalDue: 0, perChapter: {} });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chapters]);

  return (
    <>
      {/* Action bar */}
      <section className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/study/warmup"
          className="border border-[var(--border)] rounded-md p-4 hover:bg-[var(--surface-hover)] transition flex flex-col"
        >
          <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Warm-up
          </div>
          <div className="text-xl font-semibold mt-1">
            {stats === null ? "—" : stats.globalDue}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-0.5">
            card{stats?.globalDue === 1 ? "" : "s"} due
          </div>
        </Link>

        <Link
          href="/study"
          className="border border-[var(--border)] rounded-md p-4 hover:bg-[var(--surface-hover)] transition flex flex-col"
        >
          <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
            New material
          </div>
          <div className="text-xl font-semibold mt-1">Continue</div>
          <div className="text-[11px] text-[var(--muted)] mt-0.5">
            next chapter session
          </div>
        </Link>

        <Link
          href="/my-startup"
          className="border border-[var(--border)] rounded-md p-4 hover:bg-[var(--surface-hover)] transition flex flex-col"
        >
          <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
            My Startup
          </div>
          <div className="text-xl font-semibold mt-1">Apply</div>
          <div className="text-[11px] text-[var(--muted)] mt-0.5">
            channels, experiments, critical path
          </div>
        </Link>
      </section>

      {/* Chapters */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
            Chapters
          </h2>
        </div>

        <ul className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-md overflow-hidden">
          {chapters.map((ch) => {
            const prog = stats?.perChapter[ch.id];
            const masteryPct = prog ? Math.round(prog.landmarkMastery * 100) : 0;
            return (
              <li key={ch.id}>
                <Link
                  href={`/chapter/${ch.slug}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-hover)] transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] font-mono text-[var(--muted)] w-8 shrink-0">
                      CH{String(ch.number).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-[14px] font-medium truncate">
                          {ch.title}
                        </div>
                        {prog?.completed && (
                          <span
                            className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)] shrink-0"
                            title="Chapter marked complete"
                          >
                            ✓ Complete
                          </span>
                        )}
                      </div>
                      <div className="text-[12px] text-[var(--muted)] truncate">
                        {ch.concepts.length} concepts ·{" "}
                        {ch.concepts.filter((c) => c.isLandmark).length}{" "}
                        landmarks
                        {prog && prog.dueCount > 0 && (
                          <span className="ml-2 text-[var(--accent)]">
                            · {prog.dueCount} due
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <div className="hidden sm:flex flex-col items-end min-w-[80px]">
                      <div className="text-[11px] text-[var(--muted)] font-mono">
                        {masteryPct}%
                      </div>
                      <div className="mt-0.5 h-1 w-20 rounded-full bg-[var(--border)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--accent)]"
                          style={{ width: `${masteryPct}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-[var(--muted)] text-[13px]">→</span>
                  </div>
                </Link>
              </li>
            );
          })}
          {chapters.length === 0 && (
            <li className="px-4 py-8 text-center text-[13px] text-[var(--muted)]">
              No chapters loaded yet.
            </li>
          )}
        </ul>
      </section>

      {/* Totals */}
      <section className="text-[12px] text-[var(--muted)] border-t border-[var(--border)] pt-6">
        <div className="flex gap-6 flex-wrap">
          <div>
            <span className="font-mono text-[var(--foreground)]">
              {chapters.length}
            </span>{" "}
            chapter{chapters.length === 1 ? "" : "s"}
          </div>
          <div>
            <span className="font-mono text-[var(--foreground)]">
              {chapters.reduce((acc, c) => acc + c.concepts.length, 0)}
            </span>{" "}
            concepts
          </div>
          <div>
            <span className="font-mono text-[var(--foreground)]">
              {chapters.reduce(
                (acc, c) =>
                  acc +
                  c.concepts.reduce((ca, co) => ca + co.flashcards.length, 0),
                0
              )}
            </span>{" "}
            flashcards
          </div>
          <div>
            <span className="font-mono text-[var(--foreground)]">
              {chapters.reduce(
                (acc, c) =>
                  acc +
                  c.concepts.reduce((ca, co) => ca + co.scenarios.length, 0),
                0
              )}
            </span>{" "}
            scenarios
          </div>
        </div>
      </section>
    </>
  );
}
