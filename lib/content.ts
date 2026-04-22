import { promises as fs } from "fs";
import path from "path";
import type { Chapter } from "./types";

const CHAPTERS_DIR = path.join(process.cwd(), "content", "chapters");

async function readAllChapterFiles(): Promise<Chapter[]> {
  const files = await fs.readdir(CHAPTERS_DIR);
  const jsons = files.filter((f) => f.endsWith(".json"));
  const chapters = await Promise.all(
    jsons.map(async (f) => {
      const raw = await fs.readFile(path.join(CHAPTERS_DIR, f), "utf8");
      return JSON.parse(raw) as Chapter;
    })
  );
  return chapters.sort((a, b) => a.number - b.number);
}

export async function getAllChapters(): Promise<Chapter[]> {
  return readAllChapterFiles();
}

export async function getChapter(slug: string): Promise<Chapter | null> {
  const all = await readAllChapterFiles();
  return all.find((c) => c.slug === slug) ?? null;
}

export async function getChapterById(id: string): Promise<Chapter | null> {
  const all = await readAllChapterFiles();
  return all.find((c) => c.id === id) ?? null;
}
