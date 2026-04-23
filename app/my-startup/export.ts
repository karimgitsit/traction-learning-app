import type {
  ChannelExperimentRow,
  ChannelIdeaRow,
  CriticalPathMilestoneRow,
  StartupProfileRow,
  BullseyeRing,
} from "@/lib/db";
import type { ChannelRef } from "./page";

const RING_TITLES: Record<BullseyeRing, string> = {
  core: "Core",
  inner: "Inner ring — testing now",
  middle: "Middle ring — promising",
  outer: "Outer ring — brainstorm",
  none: "Unsorted",
};

const RING_ORDER: BullseyeRing[] = [
  "core",
  "inner",
  "middle",
  "outer",
  "none",
];

export function buildMarkdownExport(args: {
  profile: StartupProfileRow | null;
  channels: ChannelRef[];
  ideas: ChannelIdeaRow[];
  experiments: ChannelExperimentRow[];
  milestones: CriticalPathMilestoneRow[];
}): string {
  const { profile, channels, ideas, experiments, milestones } = args;
  const lines: string[] = [];

  lines.push("# My Startup — Traction Playbook");
  lines.push("");
  lines.push(`_Exported ${new Date().toISOString().slice(0, 10)}_`);
  lines.push("");

  // Profile
  lines.push("## Profile");
  lines.push("");
  if (profile) {
    const rows: [string, string][] = [
      ["Name", profile.name],
      ["One-liner", profile.oneLiner],
      ["Stage", profile.stage],
      ["Target customer", profile.targetCustomer],
      ["Traction goal", profile.tractionGoal],
    ];
    for (const [k, v] of rows) {
      if (v.trim()) lines.push(`- **${k}:** ${v.trim()}`);
    }
  } else {
    lines.push("_(not filled in)_");
  }
  lines.push("");

  // Bullseye
  lines.push("## Bullseye — channels");
  lines.push("");
  const ideaByChapter = new Map<string, ChannelIdeaRow>();
  ideas.forEach((r) => ideaByChapter.set(r.chapterId, r));
  const channelByChapter = new Map<string, ChannelRef>();
  channels.forEach((c) => channelByChapter.set(c.chapterId, c));

  for (const ring of RING_ORDER) {
    const list = channels.filter(
      (c) => (ideaByChapter.get(c.chapterId)?.ring ?? "none") === ring
    );
    if (list.length === 0) continue;
    lines.push(`### ${RING_TITLES[ring]}`);
    lines.push("");
    for (const ch of list) {
      const idea = ideaByChapter.get(ch.chapterId);
      lines.push(`- **${ch.title}**`);
      if (idea?.ideas.trim()) {
        for (const para of idea.ideas.trim().split(/\n+/)) {
          lines.push(`  - ${para}`);
        }
      }
    }
    lines.push("");
  }

  // Experiments
  lines.push("## Channel experiments");
  lines.push("");
  if (experiments.length === 0) {
    lines.push("_(none yet)_");
  } else {
    for (const ex of experiments) {
      lines.push(
        `### ${ex.channelLabel || "(channel)"} — ${ex.status.toUpperCase()}`
      );
      const fields: [string, string][] = [
        ["Hypothesis", ex.hypothesis],
        ["Test", ex.test],
        ["Cost / time", ex.cost],
        ["Success metric", ex.metric],
        ["Result", ex.result],
        ["Learning", ex.learning],
      ];
      for (const [k, v] of fields) {
        if (v.trim()) {
          lines.push(`- **${k}:** ${v.trim()}`);
        }
      }
      lines.push("");
    }
  }

  // Critical path
  lines.push("## Critical path");
  lines.push("");
  if (milestones.length === 0) {
    lines.push("_(none yet)_");
  } else {
    const sorted = [...milestones].sort((a, b) => a.order - b.order);
    sorted.forEach((m, i) => {
      const title = m.title.trim() || "(untitled)";
      const date = m.targetDate.trim() ? ` — ${m.targetDate.trim()}` : "";
      lines.push(
        `${i + 1}. **${title}** [${m.status}]${date}`
      );
      if (m.notes.trim()) lines.push(`   - ${m.notes.trim()}`);
    });
  }
  lines.push("");

  return lines.join("\n");
}
