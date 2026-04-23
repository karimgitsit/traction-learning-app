import SettingsClient from "./SettingsClient";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto w-full px-4 md:px-6 py-10 md:py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Settings</h1>
        <p className="text-[13px] text-[var(--muted)]">
          Customize the look and feel, or manage your local progress data.
        </p>
      </header>

      <SettingsClient />
    </div>
  );
}
