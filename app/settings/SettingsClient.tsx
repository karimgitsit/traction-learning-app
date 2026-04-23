"use client";

import { useState } from "react";
import AppearanceSettings from "./AppearanceSettings";
import DataSettings from "./DataSettings";

type Tab = "appearance" | "data";

const TABS: { id: Tab; label: string }[] = [
  { id: "appearance", label: "Appearance" },
  { id: "data", label: "Data" },
];

export default function SettingsClient() {
  const [tab, setTab] = useState<Tab>("appearance");

  return (
    <div>
      <div
        role="tablist"
        aria-label="Settings sections"
        className="flex gap-1 border-b border-[var(--border)] mb-6"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={
                "text-[13px] px-3 py-2 -mb-px border-b-2 transition " +
                (active
                  ? "border-[var(--accent)] text-[var(--foreground)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]")
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "appearance" ? <AppearanceSettings /> : <DataSettings />}
    </div>
  );
}
