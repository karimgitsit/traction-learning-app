import JournalList from "./JournalList";

export default function JournalPage() {
  return (
    <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-10 md:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Journal</h1>
        <p className="text-[13px] text-[var(--muted)]">
          End-of-session reflections. Old entries will resurface at the end of
          future sessions.
        </p>
      </header>
      <JournalList />
    </div>
  );
}
