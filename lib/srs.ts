"use client";

// Spaced-repetition layer built on ts-fsrs.
// State is persisted to IndexedDB (see lib/db.ts). A card's ID is the flashcard's
// stable JSON id (e.g. "ch02-bullseye-overview-fc1").

import {
  createEmptyCard,
  fsrs,
  Rating,
  type Card as FSRSCard,
  type Grade,
} from "ts-fsrs";
import { db, type FsrsCardRow } from "./db";

export type RatingValue = "again" | "hard" | "good" | "easy";

const RATING_MAP: Record<RatingValue, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

const scheduler = fsrs({
  request_retention: 0.9,
  enable_fuzz: true,
  enable_short_term: true,
});

// ─────────────────────── Row <-> FSRS Card conversion
function rowToCard(row: FsrsCardRow): FSRSCard {
  return {
    due: new Date(row.dueDate),
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: 0,
    reps: row.reps,
    lapses: row.lapses,
    state: 0, // ts-fsrs tolerates 0 = New; if state column needed, add later
    last_review: row.lastReview ? new Date(row.lastReview) : undefined,
  } as unknown as FSRSCard;
}

function cardToRow(
  id: string,
  conceptId: string,
  cardId: string,
  card: FSRSCard
): FsrsCardRow {
  return {
    id,
    conceptId,
    cardId,
    dueDate: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    lapses: card.lapses,
    reps: card.reps,
    lastReview: card.last_review ? card.last_review.getTime() : 0,
  };
}

// ─────────────────────── Public API

export async function getCardRow(
  conceptId: string,
  cardId: string
): Promise<FsrsCardRow | null> {
  const id = `${conceptId}::${cardId}`;
  const row = await db().fsrsCards.get(id);
  return row ?? null;
}

export async function rateCard(
  conceptId: string,
  cardId: string,
  rating: RatingValue,
  now: Date = new Date()
): Promise<FsrsCardRow> {
  const id = `${conceptId}::${cardId}`;
  const existingRow = await db().fsrsCards.get(id);

  const currentCard: FSRSCard = existingRow
    ? rowToCard(existingRow)
    : createEmptyCard(now);

  const result = scheduler.next(currentCard, now, RATING_MAP[rating]);
  const newRow = cardToRow(id, conceptId, cardId, result.card);
  await db().fsrsCards.put(newRow);
  return newRow;
}

/**
 * Return cards due by `now`, joined against the provided flashcard universe.
 * `universe` is the full list of flashcards we know about (from chapter JSON).
 * Unseen cards (no FSRS row yet) are always considered due.
 */
export async function findDue<T extends { id: string; conceptId: string }>(
  universe: T[],
  now: Date = new Date()
): Promise<T[]> {
  const rows = await db().fsrsCards.toArray();
  const rowByComposite = new Map(rows.map((r) => [r.id, r]));

  return universe.filter((card) => {
    const row = rowByComposite.get(`${card.conceptId}::${card.id}`);
    if (!row) return true; // unseen — always due
    return row.dueDate <= now.getTime();
  });
}

/** Simple mastery score per concept: fraction of flashcards with stability >= 7 days. */
export async function masteryByConcept(
  conceptIds: string[]
): Promise<Record<string, number>> {
  const rows = await db().fsrsCards
    .where("conceptId")
    .anyOf(conceptIds)
    .toArray();

  const totals: Record<string, { mature: number; seen: number }> = {};
  for (const id of conceptIds) totals[id] = { mature: 0, seen: 0 };

  for (const row of rows) {
    if (!totals[row.conceptId]) continue;
    totals[row.conceptId].seen += 1;
    if (row.stability >= 7) totals[row.conceptId].mature += 1;
  }

  const out: Record<string, number> = {};
  for (const id of conceptIds) {
    const { mature, seen } = totals[id];
    out[id] = seen === 0 ? 0 : mature / seen;
  }
  return out;
}

/** Count of due + unseen cards given a universe of flashcard IDs. */
export async function dueCount<
  T extends { id: string; conceptId: string }
>(universe: T[], now: Date = new Date()): Promise<number> {
  const due = await findDue(universe, now);
  return due.length;
}

export const RATING_LABELS: Record<RatingValue, string> = {
  again: "Again",
  hard: "Hard",
  good: "Good",
  easy: "Easy",
};

/** Approximate wait-time hint for each rating, given a card's current state. */
export function previewIntervals(
  conceptId: string,
  cardId: string,
  row: FsrsCardRow | null,
  now: Date = new Date()
): Record<RatingValue, string> {
  const card = row ? rowToCard(row) : createEmptyCard(now);
  const previews = scheduler.repeat(card, now);
  return {
    again: formatInterval(previews[Rating.Again].card.due, now),
    hard: formatInterval(previews[Rating.Hard].card.due, now),
    good: formatInterval(previews[Rating.Good].card.due, now),
    easy: formatInterval(previews[Rating.Easy].card.due, now),
  };
}

function formatInterval(due: Date, now: Date): string {
  const ms = due.getTime() - now.getTime();
  const minutes = ms / 60_000;
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))}m`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = hours / 24;
  if (days < 30) return `${Math.round(days)}d`;
  const months = days / 30;
  if (months < 12) return `${Math.round(months)}mo`;
  return `${Math.round(days / 365)}y`;
}
