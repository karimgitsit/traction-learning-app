import { getAllChapters } from "@/lib/content";
import LibraryClient from "./LibraryClient";
import type { Concept } from "@/lib/types";

export interface SearchRow {
  // Denormalized row for client-side fuzzy search.
  kind: "concept" | "flashcard" | "scenario";
  chapterSlug: string;
  chapterTitle: string;
  chapterNumber: number;
  conceptId: string;
  conceptTitle: string;
  isLandmark: boolean;
  body: string;        // what to search + display
  itemId?: string;     // flashcard / scenario id
  meta?: string;       // extra label like "RECALL" or "SCENARIO · D2"
}

export default async function LibraryPage() {
  const chapters = await getAllChapters();

  const rows: SearchRow[] = [];

  for (const ch of chapters) {
    for (const c of ch.concepts as Concept[]) {
      // Concept row — searchable on title + lesson
      rows.push({
        kind: "concept",
        chapterSlug: ch.slug,
        chapterTitle: ch.title,
        chapterNumber: ch.number,
        conceptId: c.id,
        conceptTitle: c.title,
        isLandmark: c.isLandmark,
        body: `${c.title}\n\n${c.lesson.markdown}`,
        meta: c.isLandmark ? "LANDMARK CONCEPT" : "CONCEPT",
      });

      // Flashcards
      for (const f of c.flashcards) {
        rows.push({
          kind: "flashcard",
          chapterSlug: ch.slug,
          chapterTitle: ch.title,
          chapterNumber: ch.number,
          conceptId: c.id,
          conceptTitle: c.title,
          isLandmark: c.isLandmark,
          body: `${f.front}\n\n${f.back}`,
          itemId: f.id,
          meta: f.type.toUpperCase(),
        });
      }

      // Scenarios
      for (const s of c.scenarios) {
        rows.push({
          kind: "scenario",
          chapterSlug: ch.slug,
          chapterTitle: ch.title,
          chapterNumber: ch.number,
          conceptId: c.id,
          conceptTitle: c.title,
          isLandmark: c.isLandmark,
          body: `${s.setup}\n\n${s.question}\n\n${s.modelAnswer}`,
          itemId: s.id,
          meta: `SCENARIO · D${s.difficulty}`,
        });
      }
    }
  }

  return (
    <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-10 md:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Library</h1>
        <p className="text-[13px] text-[var(--muted)]">
          Search every concept, flashcard, and scenario.
        </p>
      </header>
      <LibraryClient rows={rows} />
    </div>
  );
}
