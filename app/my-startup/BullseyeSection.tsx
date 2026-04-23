"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  db,
  type BullseyeRing,
  type ChannelIdeaRow,
} from "@/lib/db";
import type { ChannelRef } from "./page";

const RING_OPTIONS: { value: BullseyeRing; label: string; hint: string }[] = [
  { value: "none", label: "Unsorted", hint: "Not yet considered" },
  { value: "outer", label: "Outer", hint: "Brainstorm — could work" },
  { value: "middle", label: "Middle", hint: "Promising — worth ranking" },
  { value: "inner", label: "Inner", hint: "Testing now" },
  { value: "core", label: "Core", hint: "Committed channel" },
];

const RING_ORDER: BullseyeRing[] = [
  "core",
  "inner",
  "middle",
  "outer",
  "none",
];

function ringClass(r: BullseyeRing): string {
  switch (r) {
    case "core":
      return "bg-[var(--accent)]/20 text-[var(--accent)] border-[var(--accent)]/40";
    case "inner":
      return "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--border)]";
    case "middle":
      return "bg-[var(--surface-hover)] text-[var(--foreground)] border-[var(--border)]";
    case "outer":
      return "bg-transparent text-[var(--muted)] border-[var(--border)]";
    default:
      return "bg-transparent text-[var(--muted)] border-dashed border-[var(--border)]";
  }
}

export default function BullseyeSection({
  channels,
  ideas,
  onChange,
}: {
  channels: ChannelRef[];
  ideas: ChannelIdeaRow[];
  onChange: () => void | Promise<void>;
}) {
  const byId = useMemo(() => {
    const m = new Map<string, ChannelIdeaRow>();
    ideas.forEach((r) => m.set(r.chapterId, r));
    return m;
  }, [ideas]);

  // Group channels by ring for display order
  const grouped = useMemo(() => {
    const buckets: Record<BullseyeRing, ChannelRef[]> = {
      core: [],
      inner: [],
      middle: [],
      outer: [],
      none: [],
    };
    channels.forEach((ch) => {
      const ring = byId.get(ch.chapterId)?.ring ?? "none";
      buckets[ring].push(ch);
    });
    return buckets;
  }, [channels, byId]);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
          Bullseye · 19 channels
        </h2>
        <span className="text-[11px] text-[var(--muted)]">
          {ideas.filter((r) => r.ring !== "none" || r.ideas.trim()).length} /{" "}
          {channels.length} worked
        </span>
      </div>

      <div className="space-y-6">
        {RING_ORDER.map((ring) => {
          const list = grouped[ring];
          if (list.length === 0) return null;
          const meta = RING_OPTIONS.find((r) => r.value === ring)!;
          return (
            <div key={ring}>
              <div className="flex items-baseline gap-2 mb-2">
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded border ${ringClass(
                    ring
                  )}`}
                >
                  {meta.label}
                </span>
                <span className="text-[11px] text-[var(--muted)]">
                  {meta.hint}
                </span>
              </div>
              <ul className="space-y-2">
                {list.map((ch) => (
                  <ChannelCard
                    key={ch.chapterId}
                    channel={ch}
                    row={byId.get(ch.chapterId)}
                    onChange={onChange}
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ChannelCard({
  channel,
  row,
  onChange,
}: {
  channel: ChannelRef;
  row: ChannelIdeaRow | undefined;
  onChange: () => void | Promise<void>;
}) {
  const [ring, setRing] = useState<BullseyeRing>(row?.ring ?? "none");
  const [ideas, setIdeas] = useState(row?.ideas ?? "");
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [savedTick, setSavedTick] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = (nextRing: BullseyeRing, nextIdeas: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await db().channelIdeas.put({
          id: channel.chapterId,
          chapterId: channel.chapterId,
          ring: nextRing,
          ideas: nextIdeas,
          updatedAt: Date.now(),
        });
        setSavedTick((t) => t + 1);
        onChange();
      } catch (e) {
        console.error("channel idea save failed", e);
      }
    }, 400);
  };

  return (
    <li className="border border-[var(--border)] rounded-md bg-[var(--surface)]">
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-mono text-[var(--muted)]">
            CH{String(channel.number).padStart(2, "0")}
          </div>
          <Link
            href={`/chapter/${channel.chapterSlug}`}
            className="text-[14px] font-medium hover:text-[var(--accent)]"
          >
            {channel.title}
          </Link>
        </div>
        <select
          value={ring}
          onChange={(e) => {
            const next = e.target.value as BullseyeRing;
            setRing(next);
            persist(next, ideas);
          }}
          className="text-[12px] bg-[var(--background)] border border-[var(--border)] rounded px-2 py-1"
        >
          {RING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="px-4 pb-3">
        <textarea
          value={ideas}
          onChange={(e) => {
            setIdeas(e.target.value);
            persist(ring, e.target.value);
          }}
          placeholder="How could this channel work for your startup? Who would you reach, with what offer, for how much?"
          className="w-full min-h-[70px] text-[13px] p-2 rounded border border-[var(--border)] bg-[var(--background)] resize-y"
        />
        <div className="mt-2 flex items-center justify-between">
          <button
            onClick={() => setReferenceOpen((o) => !o)}
            className="text-[11px] text-[var(--muted)] hover:text-[var(--foreground)]"
            aria-expanded={referenceOpen}
          >
            {referenceOpen ? "▾ Hide" : "▸ Check against the book"}
          </button>
          {savedTick > 0 && (
            <span
              key={savedTick}
              className="text-[11px] text-[var(--muted)]"
            >
              Saved
            </span>
          )}
        </div>
        {referenceOpen && (
          <div className="mt-3 pt-3 border-t border-[var(--border)] text-[12px] leading-relaxed text-[var(--muted)]">
            <p className="mb-2">{channel.summary}</p>
            {channel.landmarks.length > 0 && (
              <>
                <div className="text-[10px] uppercase tracking-wider mb-1">
                  Landmark concepts
                </div>
                <ul className="list-disc pl-5 space-y-0.5">
                  {channel.landmarks.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </>
            )}
            <Link
              href={`/chapter/${channel.chapterSlug}`}
              className="inline-block mt-2 text-[var(--accent)] hover:underline"
            >
              Open full chapter →
            </Link>
          </div>
        )}
      </div>
    </li>
  );
}
