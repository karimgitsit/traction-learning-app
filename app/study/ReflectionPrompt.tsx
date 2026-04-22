"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/db";

function uuid() {
  // Good enough for local-only; no need for crypto-quality uniqueness.
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function ReflectionPrompt({
  sessionId,
}: {
  sessionId: string;
}) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [resurfaced, setResurfaced] = useState<{
    text: string;
    createdAt: number;
  } | null>(null);

  // Resurface a random past entry (30+ days old, else whatever exists)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await db().journalEntries.toArray();
        if (cancelled || all.length === 0) return;
        const cutoff = Date.now() - 30 * 24 * 3600 * 1000;
        const old = all.filter((e) => e.createdAt <= cutoff);
        const pool = old.length > 0 ? old : all;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        setResurfaced({ text: pick.text, createdAt: pick.createdAt });
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await db().journalEntries.put({
        id: uuid(),
        sessionId,
        text: text.trim(),
        createdAt: Date.now(),
      });
      setSavedAt(Date.now());
      setText("");
    } catch (e) {
      console.error("Could not save journal entry", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-[var(--border)] rounded-md p-5 bg-[var(--surface)]">
      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-2">
        Reflection
      </div>
      <div className="text-[14px] mb-3">
        What surprised you? What will you try this week?
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="A sentence or two is enough…"
        className="w-full min-h-[100px] p-3 text-[14px] rounded-md border border-[var(--border)] bg-[var(--background)] resize-y"
      />
      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={save}
          disabled={!text.trim() || saving}
          className="text-[13px] px-3 py-1.5 rounded bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save entry"}
        </button>
        {savedAt && (
          <span className="text-[11px] text-[var(--muted)]">
            Saved · in your Journal
          </span>
        )}
      </div>

      {resurfaced && (
        <div className="mt-6 pt-5 border-t border-[var(--border)]">
          <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-2">
            From {Math.round((Date.now() - resurfaced.createdAt) / 86_400_000)}{" "}
            day
            {Math.round((Date.now() - resurfaced.createdAt) / 86_400_000) === 1
              ? ""
              : "s"}{" "}
            ago
          </div>
          <blockquote className="text-[13px] italic text-[var(--muted)] border-l-2 border-[var(--border)] pl-3">
            “{resurfaced.text}”
          </blockquote>
        </div>
      )}
    </div>
  );
}
