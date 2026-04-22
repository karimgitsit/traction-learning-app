"use client";

import { useEffect, useState } from "react";
import { db, type JournalEntryRow } from "@/lib/db";

function formatWhen(ts: number): string {
  const diffMs = Date.now() - ts;
  const days = diffMs / 86_400_000;
  if (days < 1) {
    const hours = diffMs / 3_600_000;
    if (hours < 1) return "just now";
    return `${Math.round(hours)}h ago`;
  }
  if (days < 7) return `${Math.round(days)}d ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  return `${Math.round(days / 365)}y ago`;
}

export default function JournalList() {
  const [entries, setEntries] = useState<JournalEntryRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await db().journalEntries.toArray();
        if (cancelled) return;
        all.sort((a, b) => b.createdAt - a.createdAt);
        setEntries(all);
      } catch (e) {
        console.error("journal load failed", e);
        if (!cancelled) setEntries([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (entries === null) {
    return (
      <p className="text-[13px] text-[var(--muted)]">Loading entries…</p>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="border border-dashed border-[var(--border)] rounded-md p-8 text-center">
        <p className="text-[13px] text-[var(--muted)]">
          No entries yet. Finish a study session to write your first one.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {entries.map((e) => (
        <li
          key={e.id}
          className="border border-[var(--border)] rounded-md p-4 bg-[var(--surface)]"
        >
          <div className="text-[11px] font-mono text-[var(--muted)] mb-1">
            {formatWhen(e.createdAt)}
          </div>
          <div className="text-[14px] leading-relaxed whitespace-pre-wrap">
            {e.text}
          </div>
        </li>
      ))}
    </ul>
  );
}
