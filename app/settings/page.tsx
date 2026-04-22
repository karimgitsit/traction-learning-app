import SettingsClient from "./SettingsClient";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto w-full px-4 md:px-6 py-10 md:py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Settings</h1>
        <p className="text-[13px] text-[var(--muted)]">
          Local progress data (flashcard reviews, scenario attempts, journal
          entries) lives in your browser&apos;s IndexedDB. Use these tools to
          inspect or reset it.
        </p>
      </header>

      <SettingsClient />
    </div>
  );
}
