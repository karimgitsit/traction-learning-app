"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/db";

interface Counts {
  fsrsCards: number;
  scenarioAttempts: number;
  teachbackAttempts: number;
  journalEntries: number;
  sessions: number;
}

export default function DataSettings() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [status, setStatus] = useState<string>("");
  const [confirming, setConfirming] = useState<keyof Counts | "all" | null>(
    null
  );

  const refresh = async () => {
    try {
      const d = db();
      const next: Counts = {
        fsrsCards: await d.fsrsCards.count(),
        scenarioAttempts: await d.scenarioAttempts.count(),
        teachbackAttempts: await d.teachbackAttempts.count(),
        journalEntries: await d.journalEntries.count(),
        sessions: await d.sessions.count(),
      };
      setCounts(next);
    } catch (e) {
      console.error("settings refresh failed", e);
      setCounts({
        fsrsCards: 0,
        scenarioAttempts: 0,
        teachbackAttempts: 0,
        journalEntries: 0,
        sessions: 0,
      });
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const reset = async (table: keyof Counts | "all") => {
    try {
      const d = db();
      if (table === "all") {
        await d.fsrsCards.clear();
        await d.scenarioAttempts.clear();
        await d.teachbackAttempts.clear();
        await d.journalEntries.clear();
        await d.sessions.clear();
        setStatus("All progress cleared.");
      } else {
        await d[table].clear();
        setStatus(`Cleared ${table}.`);
      }
      setConfirming(null);
      await refresh();
      setTimeout(() => setStatus(""), 3000);
    } catch (e) {
      console.error("reset failed", e);
      setStatus("Reset failed — see console.");
    }
  };

  const rows: { key: keyof Counts; label: string; description: string }[] = [
    {
      key: "fsrsCards",
      label: "Flashcard SRS state",
      description:
        "Next-due dates, stability, difficulty per card. Reset to re-learn from scratch.",
    },
    {
      key: "scenarioAttempts",
      label: "Scenario attempts",
      description: "History of your answers and self-grades on scenarios.",
    },
    {
      key: "teachbackAttempts",
      label: "Teach-back attempts",
      description: "Your written teach-back responses with self-ratings.",
    },
    {
      key: "journalEntries",
      label: "Journal entries",
      description: "End-of-session reflections. These resurface over time.",
    },
    {
      key: "sessions",
      label: "Sessions",
      description: "Study-session metadata (start/end, item counts).",
    },
  ];

  return (
    <div>
      {status && (
        <div className="mb-4 text-[13px] px-3 py-2 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--accent)]">
          {status}
        </div>
      )}

      <div className="border border-[var(--border)] rounded-md overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
            Local Progress Data
          </div>
          <button
            onClick={() => setConfirming("all")}
            className="text-[11px] px-2 py-1 rounded border border-red-500/40 text-red-300 hover:bg-red-500/10"
          >
            Reset everything
          </button>
        </div>

        <ul>
          {rows.map((r) => (
            <li
              key={r.key}
              className="px-4 py-3 border-b border-[var(--border)] last:border-b-0 flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="text-[14px] font-medium">{r.label}</div>
                <div className="text-[12px] text-[var(--muted)] mt-0.5">
                  {r.description}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[12px] font-mono text-[var(--muted)] min-w-[2ch] text-right">
                  {counts ? counts[r.key] : "—"}
                </span>
                <button
                  onClick={() => setConfirming(r.key)}
                  className="text-[11px] px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--surface-hover)]"
                >
                  Reset
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {confirming && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={() => setConfirming(null)}
        >
          <div
            className="max-w-md w-full rounded-md border border-[var(--border)] bg-[var(--background)] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[14px] font-semibold mb-2">
              Confirm reset
            </div>
            <div className="text-[13px] text-[var(--muted)] leading-relaxed mb-4">
              {confirming === "all"
                ? "This will clear ALL local progress (SRS state, attempts, journal). Content chapters are untouched."
                : `This will clear the '${confirming}' table.`}{" "}
              Cannot be undone.
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirming(null)}
                className="text-[13px] px-3 py-1.5 rounded border border-[var(--border)] hover:bg-[var(--surface-hover)]"
              >
                Cancel
              </button>
              <button
                onClick={() => reset(confirming)}
                className="text-[13px] px-3 py-1.5 rounded bg-red-500 text-white hover:opacity-90"
              >
                Yes, reset
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 text-[12px] text-[var(--muted)]">
        Data is stored locally in your browser. Clearing site data in browser
        settings will also wipe it.
      </div>
    </div>
  );
}
