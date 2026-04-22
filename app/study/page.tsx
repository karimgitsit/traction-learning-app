import Link from "next/link";
import { getAllChapters, getChapter } from "@/lib/content";
import StudyFlow from "./StudyFlow";

interface Search {
  chapter?: string;
  concept?: string;
}

export default async function StudyPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { chapter: chapterSlug, concept: conceptId } = await searchParams;
  const chapters = await getAllChapters();

  // Pick the requested chapter, or fall back to the first available.
  const chapter = chapterSlug
    ? await getChapter(chapterSlug)
    : chapters[0] ?? null;

  if (!chapter) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-16 text-center">
        <p className="text-[13px] text-[var(--muted)] mb-4">
          {chapterSlug
            ? `No chapter with slug "${chapterSlug}".`
            : "No chapters loaded."}
        </p>
        <Link
          href="/"
          className="text-[13px] text-[var(--accent)] hover:underline"
        >
          ← Back
        </Link>
      </div>
    );
  }

  // Resolve initial concept index if a concept id was requested
  let initialIndex = 0;
  if (conceptId) {
    const found = chapter.concepts.findIndex((c) => c.id === conceptId);
    if (found >= 0) initialIndex = found;
  }

  return (
    <StudyFlow
      chapter={chapter}
      allChapters={chapters}
      initialIndex={initialIndex}
    />
  );
}
