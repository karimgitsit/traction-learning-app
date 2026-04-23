"use client";

import { useRef, useState } from "react";
import { db, type StartupProfileRow } from "@/lib/db";

const FIELDS: {
  key: keyof Omit<StartupProfileRow, "id" | "updatedAt">;
  label: string;
  placeholder: string;
  multiline?: boolean;
}[] = [
  { key: "name", label: "Name", placeholder: "e.g. ShoeLoft" },
  {
    key: "oneLiner",
    label: "One-liner",
    placeholder: "What does it do, for whom?",
  },
  {
    key: "stage",
    label: "Stage",
    placeholder: "idea · prototype · pre-launch · revenue · scaling",
  },
  {
    key: "targetCustomer",
    label: "Target customer",
    placeholder: "Who feels this pain most acutely?",
  },
  {
    key: "tractionGoal",
    label: "Traction goal",
    placeholder: "A number + deadline — e.g. 1,000 paying users by Q4",
    multiline: true,
  },
];

function empty(): StartupProfileRow {
  return {
    id: "profile",
    name: "",
    oneLiner: "",
    stage: "",
    targetCustomer: "",
    tractionGoal: "",
    updatedAt: Date.now(),
  };
}

export default function StartupProfile({
  initial,
  onChange,
}: {
  initial: StartupProfileRow | null;
  onChange: (next: StartupProfileRow) => void;
}) {
  const [profile, setProfile] = useState<StartupProfileRow>(
    initial ?? empty()
  );
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSave = (next: StartupProfileRow) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const toSave = { ...next, updatedAt: Date.now() };
        await db().startupProfiles.put(toSave);
        setSavedAt(Date.now());
        onChange(toSave);
      } catch (e) {
        console.error("profile save failed", e);
      }
    }, 400);
  };

  const update = (
    key: keyof Omit<StartupProfileRow, "id" | "updatedAt">,
    value: string
  ) => {
    const next = { ...profile, [key]: value };
    setProfile(next);
    scheduleSave(next);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
          Startup profile
        </h2>
        {savedAt && (
          <span className="text-[11px] text-[var(--muted)]">Saved</span>
        )}
      </div>
      <div className="border border-[var(--border)] rounded-md bg-[var(--surface)] divide-y divide-[var(--border)]">
        {FIELDS.map((f) => (
          <div key={f.key} className="px-4 py-3">
            <label className="block text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1.5">
              {f.label}
            </label>
            {f.multiline ? (
              <textarea
                value={profile[f.key]}
                onChange={(e) => update(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full min-h-[60px] text-[14px] bg-transparent resize-y focus:outline-none"
              />
            ) : (
              <input
                value={profile[f.key]}
                onChange={(e) => update(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full text-[14px] bg-transparent focus:outline-none"
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
