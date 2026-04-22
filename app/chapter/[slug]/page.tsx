import Link from "next/link";
import { notFound } from "next/navigation";
import { getChapter } from "@/lib/content";

interface Params {
  slug: string;
}

export default async function ChapterDetail({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const chapter = await getChapter(slug);
  if (!chapter) notFound();

  return (
    <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-10 md:py-12">
      <Link
        href="/"
        className="text-[12px] text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        ← Dashboard
      </Link>
      <header className="mt-4 mb-8">
        <div className="text-[11px] font-mono text-[var(--muted)] mb-2">
          CH{String(chapter.number).padStart(2, "0")}
        </div>
        <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight mb-3">
          {chapter.title}
        </h1>
        <p className="text-[14px] text-[var(--muted)] leading-relaxed max-w-prose">
          {chapter.summary}
        </p>
        <div className="mt-4">
          <Link
            href={`/study?chapter=${chapter.slug}`}
            className="inline-block text-[13px] px-4 py-2 rounded bg-[var(--accent)] text-white hover:opacity-90"
          >
            Start study session
          </Link>
        </div>
      </header>

      <section>
        <h2 className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-3">
          Concepts
        </h2>
        <ol className="space-y-2">
          {chapter.concepts.map((c) => (
            <li key={c.id}>
              <Link
                href={`/study?chapter=${chapter.slug}&concept=${c.id}`}
                className="block border border-[var(--border)] rounded-md p-4 hover:bg-[var(--surface-hover)] transition"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] text-[var(--muted)]">
                    #{c.order}
                  </span>
                  {c.isLandmark && (
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)]">
                      Landmark
                    </span>
                  )}
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[15px] font-medium mb-2">
                      {c.title}
                    </div>
                    <div className="text-[12px] text-[var(--muted)] flex gap-4 flex-wrap">
                      <span>
                        {c.flashcards.length} flashcard
                        {c.flashcards.length === 1 ? "" : "s"}
                      </span>
                      <span>
                        {c.scenarios.length} scenario
                        {c.scenarios.length === 1 ? "" : "s"}
                      </span>
                      <span>~{c.lesson.readingTimeMin} min lesson</span>
                    </div>
                  </div>
                  <span className="text-[var(--muted)] text-[13px] shrink-0 mt-1">
                    →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
