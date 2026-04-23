"use client";

import { useCallback, useEffect, useState } from "react";
import { db } from "@/lib/db";
import type {
  ChannelExperimentRow,
  ChannelIdeaRow,
  CriticalPathMilestoneRow,
  StartupProfileRow,
} from "@/lib/db";
import type { ChannelRef } from "./page";
import StartupProfile from "./StartupProfile";
import BullseyeSection from "./BullseyeSection";
import ExperimentsSection from "./ExperimentsSection";
import CriticalPathSection from "./CriticalPathSection";
import { buildMarkdownExport } from "./export";

export default function MyStartupClient({
  channels,
}: {
  channels: ChannelRef[];
}) {
  const [profile, setProfile] = useState<StartupProfileRow | null>(null);
  const [ideas, setIdeas] = useState<ChannelIdeaRow[]>([]);
  const [experiments, setExperiments] = useState<ChannelExperimentRow[]>([]);
  const [milestones, setMilestones] = useState<CriticalPathMilestoneRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>("");

  const reload = useCallback(async () => {
    const d = db();
    const [p, i, e, m] = await Promise.all([
      d.startupProfiles.get("profile"),
      d.channelIdeas.toArray(),
      d.channelExperiments.toArray(),
      d.criticalPathMilestones.toArray(),
    ]);
    setProfile(p ?? null);
    setIdeas(i);
    setExperiments(e.sort((a, b) => b.updatedAt - a.updatedAt));
    setMilestones(m.sort((a, b) => a.order - b.order));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await reload();
      } catch (err) {
        console.error("my-startup load failed", err);
      } finally {
        setLoaded(true);
      }
    })();
  }, [reload]);

  const onExport = async (mode: "copy" | "download") => {
    const md = buildMarkdownExport({
      profile,
      channels,
      ideas,
      experiments,
      milestones,
    });
    if (mode === "copy") {
      try {
        await navigator.clipboard.writeText(md);
        setExportStatus("Copied markdown to clipboard.");
      } catch {
        setExportStatus("Copy failed — try Download instead.");
      }
    } else {
      const blob = new Blob([md], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-startup-${new Date().toISOString().slice(0, 10)}.md`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setExportStatus("Downloaded markdown file.");
    }
    setTimeout(() => setExportStatus(""), 3000);
  };

  if (!loaded) {
    return (
      <p className="text-[13px] text-[var(--muted)]">Loading your notes…</p>
    );
  }

  return (
    <div className="space-y-10">
      <StartupProfile initial={profile} onChange={setProfile} />

      <BullseyeSection
        channels={channels}
        ideas={ideas}
        onChange={reload}
      />

      <ExperimentsSection
        channels={channels}
        experiments={experiments}
        onChange={reload}
      />

      <CriticalPathSection
        milestones={milestones}
        onChange={reload}
      />

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
            Export
          </h2>
          {exportStatus && (
            <span className="text-[11px] text-[var(--accent)]">
              {exportStatus}
            </span>
          )}
        </div>
        <div className="border border-[var(--border)] rounded-md p-4 bg-[var(--surface)]">
          <p className="text-[13px] text-[var(--muted)] mb-3">
            Everything on this page lives in your browser (IndexedDB). Export as
            markdown, then paste into a Notion page or import the{" "}
            <span className="font-mono">.md</span> file — Notion renders it
            natively.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onExport("copy")}
              className="text-[13px] px-3 py-1.5 rounded bg-[var(--accent)] text-white hover:opacity-90"
            >
              Copy as markdown
            </button>
            <button
              onClick={() => onExport("download")}
              className="text-[13px] px-3 py-1.5 rounded border border-[var(--border)] hover:bg-[var(--surface-hover)]"
            >
              Download .md
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
