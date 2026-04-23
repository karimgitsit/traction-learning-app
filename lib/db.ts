// Client-side IndexedDB (Dexie) scaffold.
// Source of truth for study progress. A Supabase sync mirror can be added later.

import Dexie, { type Table } from "dexie";

// FSRS-compatible card state (simplified; actual FSRS lib can be wired later).
export interface FsrsCardRow {
  id: string;             // conceptId + cardId composite
  conceptId: string;
  cardId: string;
  dueDate: number;        // epoch ms
  stability: number;      // FSRS state
  difficulty: number;     // FSRS state
  lapses: number;
  reps: number;
  lastReview: number;     // epoch ms
}

export interface ScenarioAttemptRow {
  id: string;             // uuid
  conceptId: string;
  scenarioId: string;
  score: number;          // 0-1 self-grade against rubric
  attemptedAt: number;
}

export interface TeachbackAttemptRow {
  id: string;             // uuid
  conceptId: string;
  text: string;
  selfRating: number;     // 1-5
  attemptedAt: number;
}

export interface JournalEntryRow {
  id: string;             // uuid
  sessionId: string;
  text: string;
  createdAt: number;
}

export interface SessionRow {
  id: string;             // uuid
  startedAt: number;
  endedAt: number | null;
  itemsReviewed: number;
}

export interface ChapterCompletionRow {
  id: string;             // chapterId (one row per chapter)
  chapterId: string;
  completedAt: number;
}

export interface StartupProfileRow {
  id: string;             // "profile" — singleton
  name: string;
  oneLiner: string;
  stage: string;
  targetCustomer: string;
  tractionGoal: string;
  updatedAt: number;
}

export type BullseyeRing = "none" | "outer" | "middle" | "inner" | "core";

export interface ChannelIdeaRow {
  id: string;             // chapterId — one row per channel chapter
  chapterId: string;
  ring: BullseyeRing;
  ideas: string;
  updatedAt: number;
}

export type ExperimentStatus = "planned" | "running" | "done";

export interface ChannelExperimentRow {
  id: string;             // uuid
  chapterId: string;      // which channel this tests (may be empty for custom)
  channelLabel: string;   // display label (channel title or free text)
  hypothesis: string;
  test: string;
  cost: string;
  metric: string;
  result: string;
  learning: string;
  status: ExperimentStatus;
  createdAt: number;
  updatedAt: number;
}

export type MilestoneStatus = "todo" | "doing" | "done";

export interface CriticalPathMilestoneRow {
  id: string;             // uuid
  title: string;
  notes: string;
  targetDate: string;     // free-text or YYYY-MM-DD
  status: MilestoneStatus;
  order: number;
  updatedAt: number;
}

export class TractionDB extends Dexie {
  fsrsCards!: Table<FsrsCardRow, string>;
  scenarioAttempts!: Table<ScenarioAttemptRow, string>;
  teachbackAttempts!: Table<TeachbackAttemptRow, string>;
  journalEntries!: Table<JournalEntryRow, string>;
  sessions!: Table<SessionRow, string>;
  chapterCompletions!: Table<ChapterCompletionRow, string>;
  startupProfiles!: Table<StartupProfileRow, string>;
  channelIdeas!: Table<ChannelIdeaRow, string>;
  channelExperiments!: Table<ChannelExperimentRow, string>;
  criticalPathMilestones!: Table<CriticalPathMilestoneRow, string>;

  constructor() {
    super("traction");
    this.version(1).stores({
      fsrsCards: "id, conceptId, dueDate",
      scenarioAttempts: "id, conceptId, scenarioId, attemptedAt",
      teachbackAttempts: "id, conceptId, attemptedAt",
      journalEntries: "id, sessionId, createdAt",
      sessions: "id, startedAt",
    });
    this.version(2).stores({
      chapterCompletions: "id, chapterId, completedAt",
    });
    this.version(3).stores({
      startupProfiles: "id, updatedAt",
      channelIdeas: "id, chapterId, ring, updatedAt",
      channelExperiments: "id, chapterId, status, updatedAt",
      criticalPathMilestones: "id, order, status, updatedAt",
    });
  }
}

// Lazy singleton — avoid touching IndexedDB during server-side rendering.
let _db: TractionDB | null = null;
export function db(): TractionDB {
  if (typeof window === "undefined") {
    throw new Error("db() must be called on the client only");
  }
  if (!_db) _db = new TractionDB();
  return _db;
}
