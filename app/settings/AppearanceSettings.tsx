"use client";

import { useSyncExternalStore } from "react";
import {
  ACCENT_OPTIONS,
  DEFAULT_APPEARANCE,
  FONT_SIZE_OPTIONS,
  THEME_OPTIONS,
  type AppearanceSettings,
  getAppearanceServerSnapshot,
  getAppearanceSnapshot,
  setAppearance,
  subscribeAppearance,
} from "@/lib/settings";

export default function AppearanceSettings() {
  const settings = useSyncExternalStore(
    subscribeAppearance,
    getAppearanceSnapshot,
    getAppearanceServerSnapshot
  );

  const update = (patch: Partial<AppearanceSettings>) => {
    setAppearance({ ...settings, ...patch });
  };

  return (
    <div className="border border-[var(--border)] rounded-md overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
          Appearance
        </div>
        <button
          onClick={() => setAppearance(DEFAULT_APPEARANCE)}
          className="text-[11px] px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--surface-hover)]"
        >
          Reset to defaults
        </button>
      </div>

      <div className="px-4 py-4 border-b border-[var(--border)]">
        <div className="text-[14px] font-medium mb-1">Theme</div>
        <div className="text-[12px] text-[var(--muted)] mb-3">
          Choose a color scheme. &ldquo;System&rdquo; follows your OS preference.
        </div>
        <div role="radiogroup" aria-label="Theme" className="flex gap-2 flex-wrap">
          {THEME_OPTIONS.map((opt) => {
            const active = settings.theme === opt.value;
            return (
              <button
                key={opt.value}
                role="radio"
                aria-checked={active}
                onClick={() => update({ theme: opt.value })}
                className={
                  "text-[13px] px-3 py-1.5 rounded border transition " +
                  (active
                    ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--foreground)]"
                    : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-hover)]")
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4 border-b border-[var(--border)]">
        <div className="text-[14px] font-medium mb-1">Font size</div>
        <div className="text-[12px] text-[var(--muted)] mb-3">
          Scale the entire interface up or down.
        </div>
        <div role="radiogroup" aria-label="Font size" className="flex gap-2 flex-wrap">
          {FONT_SIZE_OPTIONS.map((opt) => {
            const active = settings.fontSize === opt.value;
            return (
              <button
                key={opt.value}
                role="radio"
                aria-checked={active}
                onClick={() => update({ fontSize: opt.value })}
                className={
                  "text-[13px] px-3 py-1.5 rounded border transition " +
                  (active
                    ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--foreground)]"
                    : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-hover)]")
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="text-[14px] font-medium mb-1">Accent color</div>
        <div className="text-[12px] text-[var(--muted)] mb-3">
          Used for highlights, links, and progress bars.
        </div>
        <div role="radiogroup" aria-label="Accent color" className="flex gap-2 flex-wrap">
          {ACCENT_OPTIONS.map((opt) => {
            const active = settings.accent === opt.value;
            return (
              <button
                key={opt.value}
                role="radio"
                aria-checked={active}
                aria-label={opt.label}
                title={opt.label}
                onClick={() => update({ accent: opt.value })}
                className={
                  "h-8 w-8 rounded-full border-2 transition flex items-center justify-center " +
                  (active
                    ? "border-[var(--foreground)]"
                    : "border-transparent hover:border-[var(--border)]")
                }
                style={{ backgroundColor: opt.swatch }}
              >
                {active && (
                  <span className="text-white text-[12px] leading-none">✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
