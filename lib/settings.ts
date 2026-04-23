export type Theme = "system" | "light" | "dark";
export type FontSize = "small" | "medium" | "large";
export type Accent = "blue" | "green" | "purple" | "orange" | "rose";

export interface AppearanceSettings {
  theme: Theme;
  fontSize: FontSize;
  accent: Accent;
}

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  theme: "system",
  fontSize: "medium",
  accent: "blue",
};

export const APPEARANCE_STORAGE_KEY = "traction:appearance";

export const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export const FONT_SIZE_OPTIONS: { value: FontSize; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

export const ACCENT_OPTIONS: { value: Accent; label: string; swatch: string }[] = [
  { value: "blue", label: "Blue", swatch: "#3b82f6" },
  { value: "green", label: "Green", swatch: "#10b981" },
  { value: "purple", label: "Purple", swatch: "#8b5cf6" },
  { value: "orange", label: "Orange", swatch: "#f97316" },
  { value: "rose", label: "Rose", swatch: "#f43f5e" },
];

function readFromStorage(): AppearanceSettings {
  if (typeof window === "undefined") return DEFAULT_APPEARANCE;
  try {
    const raw = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (!raw) return DEFAULT_APPEARANCE;
    const parsed = JSON.parse(raw) as Partial<AppearanceSettings>;
    return {
      theme: parsed.theme ?? DEFAULT_APPEARANCE.theme,
      fontSize: parsed.fontSize ?? DEFAULT_APPEARANCE.fontSize,
      accent: parsed.accent ?? DEFAULT_APPEARANCE.accent,
    };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

function writeAppearanceDom(settings: AppearanceSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = settings.theme;
  root.dataset.fontSize = settings.fontSize;
  root.dataset.accent = settings.accent;
}

// Tiny external store so React components can read and update appearance via
// `useSyncExternalStore`, which avoids the setState-in-effect anti-pattern.
let snapshot: AppearanceSettings = DEFAULT_APPEARANCE;
let snapshotInitialized = false;
const listeners = new Set<() => void>();

function ensureInitialized() {
  if (!snapshotInitialized && typeof window !== "undefined") {
    snapshot = readFromStorage();
    snapshotInitialized = true;
  }
}

export function subscribeAppearance(cb: () => void) {
  ensureInitialized();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getAppearanceSnapshot(): AppearanceSettings {
  ensureInitialized();
  return snapshot;
}

export function getAppearanceServerSnapshot(): AppearanceSettings {
  return DEFAULT_APPEARANCE;
}

export function setAppearance(settings: AppearanceSettings) {
  snapshot = settings;
  snapshotInitialized = true;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        APPEARANCE_STORAGE_KEY,
        JSON.stringify(settings)
      );
    } catch {
      /* ignore quota / disabled storage */
    }
  }
  writeAppearanceDom(settings);
  listeners.forEach((l) => l());
}
