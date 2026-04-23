"use client";

import { useState } from "react";
import {
  db,
  type CriticalPathMilestoneRow,
  type MilestoneStatus,
} from "@/lib/db";

const STATUS_LABELS: Record<MilestoneStatus, string> = {
  todo: "To do",
  doing: "Doing",
  done: "Done",
};

function uuid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function CriticalPathSection({
  milestones,
  onChange,
}: {
  milestones: CriticalPathMilestoneRow[];
  onChange: () => void | Promise<void>;
}) {
  const add = async () => {
    const maxOrder = milestones.reduce((m, r) => Math.max(m, r.order), -1);
    await db().criticalPathMilestones.put({
      id: uuid(),
      title: "",
      notes: "",
      targetDate: "",
      status: "todo",
      order: maxOrder + 1,
      updatedAt: Date.now(),
    });
    onChange();
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
          Critical path
        </h2>
        <button
          onClick={add}
          className="text-[11px] px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--surface-hover)]"
        >
          + Add milestone
        </button>
      </div>

      {milestones.length === 0 ? (
        <div className="border border-dashed border-[var(--border)] rounded-md p-6 text-center">
          <p className="text-[13px] text-[var(--muted)]">
            List only the milestones that are strictly necessary to hit your
            traction goal. If it doesn&apos;t move you along this path, cut it.
          </p>
        </div>
      ) : (
        <ol className="space-y-2">
          {milestones.map((m, idx) => (
            <MilestoneRow
              key={m.id}
              milestone={m}
              index={idx}
              total={milestones.length}
              onChange={onChange}
              onMove={async (dir) => {
                const swapIdx = idx + dir;
                if (swapIdx < 0 || swapIdx >= milestones.length) return;
                const other = milestones[swapIdx];
                await db().criticalPathMilestones.bulkPut([
                  { ...m, order: other.order, updatedAt: Date.now() },
                  { ...other, order: m.order, updatedAt: Date.now() },
                ]);
                onChange();
              }}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

function MilestoneRow({
  milestone,
  index,
  total,
  onChange,
  onMove,
}: {
  milestone: CriticalPathMilestoneRow;
  index: number;
  total: number;
  onChange: () => void | Promise<void>;
  onMove: (dir: -1 | 1) => void | Promise<void>;
}) {
  const [row, setRow] = useState(milestone);

  const update = async (patch: Partial<CriticalPathMilestoneRow>) => {
    const next = { ...row, ...patch, updatedAt: Date.now() };
    setRow(next);
    await db().criticalPathMilestones.put(next);
  };

  const remove = async () => {
    await db().criticalPathMilestones.delete(row.id);
    onChange();
  };

  return (
    <li className="border border-[var(--border)] rounded-md bg-[var(--surface)] px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center pt-1">
          <button
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="text-[10px] text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-30"
            aria-label="Move up"
          >
            ▲
          </button>
          <span className="text-[11px] font-mono text-[var(--muted)]">
            {index + 1}
          </span>
          <button
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="text-[10px] text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-30"
            aria-label="Move down"
          >
            ▼
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <input
            value={row.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="Milestone — e.g. 'ship MVP to 50 beta users'"
            className="w-full text-[14px] font-medium bg-transparent focus:outline-none"
          />
          <textarea
            value={row.notes}
            onChange={(e) => update({ notes: e.target.value })}
            placeholder="Why this is on the critical path — and what proves it's done"
            className="w-full min-h-[40px] mt-1 text-[13px] text-[var(--muted)] bg-transparent resize-y focus:outline-none"
          />
          <div className="mt-2 flex items-center gap-3">
            <input
              value={row.targetDate}
              onChange={(e) => update({ targetDate: e.target.value })}
              placeholder="Target (YYYY-MM-DD or free text)"
              className="text-[12px] bg-[var(--background)] border border-[var(--border)] rounded px-2 py-1 w-[200px]"
            />
            <select
              value={row.status}
              onChange={(e) =>
                update({ status: e.target.value as MilestoneStatus })
              }
              className="text-[12px] bg-[var(--background)] border border-[var(--border)] rounded px-2 py-1"
            >
              {(Object.keys(STATUS_LABELS) as MilestoneStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <div className="flex-1" />
            <button
              onClick={remove}
              className="text-[11px] text-[var(--muted)] hover:text-red-400"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
