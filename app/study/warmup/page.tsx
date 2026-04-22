import Link from "next/link";
import { getAllChapters } from "@/lib/content";
import WarmupClient from "./WarmupClient";
import type { FlashcardWithContext } from "../FlashcardReview";

export default async function WarmupPage() {
  const chapters = await getAllChapters();

  // Build the full flashcard universe across all chapters.
  const universe: FlashcardWithContext[] = [];
  for (const ch of chapters) {
    for (const concept of ch.concepts) {
      for (const card of concept.flashcards) {
        universe.push({
          ...card,
          conceptId: concept.id,
          conceptTitle: concept.title,
          chapterSlug: ch.slug,
        });
      }
    }
  }

  if (universe.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-16 text-center">
        <p className="text-[13px] text-[var(--muted)] mb-4">
          No flashcards available yet.
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

  return <WarmupClient universe={universe} />;
}
