import { getAllChapters } from "@/lib/content";
import MyStartupClient from "./MyStartupClient";

export interface ChannelRef {
  chapterId: string;
  chapterSlug: string;
  number: number;
  title: string;
  summary: string;
  landmarks: string[];
}

// Chapters 6..24 in the book are the 19 traction channels; 1–5 are frameworks.
// We scope the Bullseye to channel chapters only.
const CHANNEL_START = 6;
const CHANNEL_END = 24;

export default async function MyStartupPage() {
  const chapters = await getAllChapters();

  const channels: ChannelRef[] = chapters
    .filter((c) => c.number >= CHANNEL_START && c.number <= CHANNEL_END)
    .map((c) => ({
      chapterId: c.id,
      chapterSlug: c.slug,
      number: c.number,
      title: c.title,
      summary: c.summary,
      landmarks: c.concepts
        .filter((k) => k.isLandmark)
        .map((k) => k.title),
    }));

  return (
    <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-10 md:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          My Startup
        </h1>
        <p className="text-[13px] text-[var(--muted)] leading-relaxed">
          Apply the book to your own company as you read. Sketch how each
          channel could work for you, run experiments, and track the critical
          path to your next traction goal. Best done chapter by chapter —
          revisit and refine as you learn.
        </p>
        <p className="text-[11px] text-[var(--muted)] mt-3">
          Saved locally in your browser. Use{" "}
          <span className="font-mono">Export</span> below to back up or move to
          Notion.
        </p>
      </header>

      <MyStartupClient channels={channels} />
    </div>
  );
}
