"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { SearchRow } from "./page";

// Tiny highlighter that bolds each query term in a piece of text.
function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const terms = query.trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return text;
  const pattern = new RegExp(
    `(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi"
  );
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    pattern.test(part) ? (
      <mark
        key={i}
        className="bg-[var(--accent)]/25 text-[var(--foreground)] rounded px-0.5"
      >
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

// Return a short snippet around the first match.
function snippet(body: string, query: string, width = 180): string {
  if (!query.trim()) return body.slice(0, width) + (body.length > width ? "…" : "");
  const terms = query.trim().split(/\s+/).filter(Boolean);
  const pattern = new RegExp(
    terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
    "i"
  );
  const match = body.match(pattern);
  if (!match || match.index === undefined) {
    return body.slice(0, width) + (body.length > width ? "…" : "");
  }
  const start = Math.max(0, match.index - Math.floor(width / 3));
  const end = Math.min(body.length, start + width);
  return (
    (start > 0 ? "…" : "") +
    body.slice(start, end) +
    (end < body.length ? "…" : "")
  );
}

function scoreRow(row: SearchRow, terms: string[]): number {
  if (terms.length === 0) return 0;
  const hay = (row.conceptTitle + "\n" + row.body).toLowerCase();
  let score = 0;
  for (const t of terms) {
    const lower = t.toLowerCase();
    const titleHit = row.conceptTitle.toLowerCase().includes(lower) ? 3 : 0;
    const bodyHit = hay.includes(lower) ? 1 : 0;
    score += titleHit + bodyHit;
  }
  if (row.kind === "concept") score += 0.5;
  if (row.isLandmark) score += 0.25;
  return score;
}

type Kind = SearchRow["kind"] | "all";

export default function LibraryClient({ rows }: { rows: SearchRow[] }) {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<Kind>("all");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on / keypress (global shortcut)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLInputElement)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const filtered = useMemo(() => {
    const terms = q.trim().split(/\s+/).filter(Boolean);
    let universe = kind === "all" ? rows : rows.filter((r) => r.kind === kind);
    if (terms.length === 0) {
      // No query: show concepts only by default to avoid overwhelming the list.
      if (kind === "all") universe = universe.filter((r) => r.kind === "concept");
      return universe.slice(0, 200);
    }
    const scored = universe
      .map((r) => ({ row: r, s: scoreRow(r, terms) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 100);
    return scored.map((x) => x.row);
  }, [q, kind, rows]);

  const KIND_COUNTS = useMemo(() => {
    const c = { all: rows.length, concept: 0, flashcard: 0, scenario: 0 };
    rows.forEach((r) => {
      c[r.kind] += 1;
    });
    return c;
  }, [rows]);

  return (
    <div>
      <div className="relative mb-4">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search concepts, flashcards, scenarios… ( / to focus )"
          className="w-full px-3 py-2.5 text-[14px] rounded-md border border-[var(--border)] bg-[var(--surface)] focus:bg-[var(--background)]"
        />
      </div>

      <div className="flex gap-2 flex-wrap mb-5 text-[11px]">
        {(
          [
            ["all", "All"],
            ["concept", "Concepts"],
            ["flashcard", "Flashcards"],
            ["scenario", "Scenarios"],
          ] as [Kind, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={`px-2 py-1 rounded border transition ${
              kind === k
                ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
                : "border-[var(--border)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            {label}{" "}
            <span className="font-mono opacity-70">
              {k === "all" ? KIND_COUNTS.all : KIND_COUNTS[k]}
            </span>
          </button>
        ))}
      </div>

      <div className="text-[11px] text-[var(--muted)] mb-3">
        {q.trim() ? (
          <span>
            {filtered.length} match{filtered.length === 1 ? "" : "es"} for “{q}”
          </span>
        ) : (
          <span>Showing concepts — type to search across everything.</span>
        )}
      </div>

      <ul className="space-y-2">
        {filtered.map((r, i) => (
          <li
            key={`${r.conceptId}-${r.itemId ?? r.kind}-${i}`}
            className="border border-[var(--border)] rounded-md p-3 bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition"
          >
            <div className="flex items-center gap-2 mb-1 text-[10px] uppercase tracking-wider text-[var(--muted)]">
              <Link
                href={`/chapter/${r.chapterSlug}`}
                className="hover:text-[var(--foreground)] font-mono"
              >
                CH{String(r.chapterNumber).padStart(2, "0")}
              </Link>
              <span>·</span>
              <span>{r.meta}</span>
              {r.isLandmark && <span className="text-[var(--accent)]">· Landmark</span>}
            </div>
            <div className="text-[14px] font-medium mb-1">
              {highlight(r.conceptTitle, q)}
            </div>
            <div className="text-[13px] text-[var(--muted)] leading-relaxed">
              {highlight(snippet(r.body, q), q)}
            </div>
          </li>
        ))}
        {filtered.length === 0 && q.trim() && (
          <li className="text-center text-[13px] text-[var(--muted)] py-8">
            No matches.
          </li>
        )}
      </ul>
    </div>
  );
}
