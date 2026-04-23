"use client";

import { useMemo, useState } from "react";
import {
  db,
  type ChannelExperimentRow,
  type ExperimentStatus,
} from "@/lib/db";
import type { ChannelRef } from "./page";

const STATUS_LABELS: Record<ExperimentStatus, string> = {
  planned: "Planned",
  running: "Running",
  done: "Done",
};

function uuid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function ExperimentsSection({
  channels,
  experiments,
  onChange,
}: {
  channels: ChannelRef[];
  experiments: ChannelExperimentRow[];
  onChange: () => void | Promise<void>;
}) {
  const channelOptions = useMemo(
    () => channels.map((c) => ({ id: c.chapterId, label: c.title })),
    [channels]
  );

  const add = async () => {
    const first = channelOptions[0];
    await db().channelExperiments.put({
      id: uuid(),
      chapterId: first?.id ?? "",
      channelLabel: first?.label ?? "",
      hypothesis: "",
      test: "",
      cost: "",
      metric: "",
      result: "",
      learning: "",
      status: "planned",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    onChange();
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
          Channel experiments
        </h2>
        <button
          onClick={add}
          className="text-[11px] px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--surface-hover)]"
        >
          + Add experiment
        </button>
      </div>

      {experiments.length === 0 ? (
        <div className="border border-dashed border-[var(--border)] rounded-md p-6 text-center">
          <p className="text-[13px] text-[var(--muted)]">
            Cheap tests beat long debates. Add your first experiment — a
            hypothesis, a test you can run this week, what success looks like.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {experiments.map((ex) => (
            <ExperimentCard
              key={ex.id}
              experiment={ex}
              channelOptions={channelOptions}
              onChange={onChange}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function ExperimentCard({
  experiment,
  channelOptions,
  onChange,
}: {
  experiment: ChannelExperimentRow;
  channelOptions: { id: string; label: string }[];
  onChange: () => void | Promise<void>;
}) {
  const [row, setRow] = useState(experiment);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const update = async (
    patch: Partial<ChannelExperimentRow>,
    defer = true
  ) => {
    const next = { ...row, ...patch, updatedAt: Date.now() };
    setRow(next);
    if (!defer) {
      await db().channelExperiments.put(next);
      onChange();
    } else {
      // Autosave on each keystroke — IndexedDB writes are cheap.
      await db().channelExperiments.put(next);
    }
  };

  const remove = async () => {
    await db().channelExperiments.delete(row.id);
    onChange();
  };

  const onChannelChange = (chapterId: string) => {
    const match = channelOptions.find((o) => o.id === chapterId);
    update({ chapterId, channelLabel: match?.label ?? "" }, false);
  };

  const fields: {
    key: "hypothesis" | "test" | "cost" | "metric" | "result" | "learning";
    label: string;
    placeholder: string;
    small?: boolean;
  }[] = [
    {
      key: "hypothesis",
      label: "Hypothesis",
      placeholder: "If we do X, then Y will happen because…",
    },
    {
      key: "test",
      label: "Test",
      placeholder: "Smallest, cheapest thing that would prove/disprove it",
    },
    { key: "cost", label: "Cost / time", placeholder: "$ and hours", small: true },
    {
      key: "metric",
      label: "Success metric",
      placeholder: "What number tells you it worked?",
      small: true,
    },
    {
      key: "result",
      label: "Result",
      placeholder: "What actually happened — numbers, not vibes",
    },
    {
      key: "learning",
      label: "Learning",
      placeholder: "What will you do differently?",
    },
  ];

  return (
    <li className="border border-[var(--border)] rounded-md bg-[var(--surface)]">
      <div className="px-4 py-3 flex items-center gap-3 border-b border-[var(--border)]">
        <select
          value={row.chapterId}
          onChange={(e) => onChannelChange(e.target.value)}
          className="text-[13px] bg-[var(--background)] border border-[var(--border)] rounded px-2 py-1 max-w-[220px]"
        >
          {channelOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={row.status}
          onChange={(e) =>
            update({ status: e.target.value as ExperimentStatus }, false)
          }
          className="text-[12px] bg-[var(--background)] border border-[var(--border)] rounded px-2 py-1"
        >
          {(Object.keys(STATUS_LABELS) as ExperimentStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <div className="flex-1" />
        <button
          onClick={remove}
          className="text-[11px] text-[var(--muted)] hover:text-red-400"
          aria-label="Delete experiment"
        >
          Delete
        </button>
      </div>
      <div className="px-4 py-3 grid gap-3 grid-cols-1 sm:grid-cols-2">
        {fields.map((f) => (
          <div
            key={f.key}
            className={f.small ? "" : "sm:col-span-2"}
          >
            <label className="block text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">
              {f.label}
            </label>
            <textarea
              value={row[f.key]}
              onChange={(e) => update({ [f.key]: e.target.value })}
              placeholder={f.placeholder}
              className="w-full min-h-[40px] text-[13px] p-2 rounded border border-[var(--border)] bg-[var(--background)] resize-y"
            />
          </div>
        ))}
      </div>
      <div className="px-4 pb-3">
        <button
          onClick={() => setFeedbackOpen((o) => !o)}
          className="text-[11px] text-[var(--muted)] hover:text-[var(--foreground)]"
          aria-expanded={feedbackOpen}
        >
          {feedbackOpen ? "▾ Hide self-check" : "▸ Self-check this experiment"}
        </button>
        {feedbackOpen && (
          <div className="mt-3 pt-3 border-t border-[var(--border)] text-[12px] leading-relaxed text-[var(--muted)] space-y-1">
            <div>
              <strong className="text-[var(--foreground)]">Hypothesis</strong>{" "}
              — is it falsifiable? A real hypothesis can be wrong.
            </div>
            <div>
              <strong className="text-[var(--foreground)]">Test</strong> — can
              you run it in ≤ 1 week for &lt; $1,000? If not, make it smaller.
            </div>
            <div>
              <strong className="text-[var(--foreground)]">Metric</strong> — is
              it a number you can measure now, not a feeling?
            </div>
            <div>
              <strong className="text-[var(--foreground)]">Critical path
              fit</strong>{" "}
              — does the result advance your traction goal, or is it a
              distraction?
            </div>
          </div>
        )}
      </div>
    </li>
  );
}
