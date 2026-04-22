import { getAllChapters } from "@/lib/content";
import DashboardClient from "./DashboardClient";

export default async function Dashboard() {
  const chapters = await getAllChapters();

  return (
    <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-10 md:py-14">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          Traction — Learn
        </h1>
        <p className="text-[13px] text-[var(--muted)] max-w-prose">
          A personal learning app for deeply understanding the concepts in{" "}
          <em>Traction</em> by Weinberg &amp; Mares.
        </p>
      </header>

      <DashboardClient chapters={chapters} />
    </div>
  );
}
