// Content model — matches the JSON files in app/content/chapters/*.json

export type CardType = "recognition" | "recall" | "cloze";

export type ItemType =
  | "pretest"
  | "lesson"
  | "worked_example"
  | "contrast"
  | "flashcard"
  | "scenario"
  | "teachback";

export interface Flashcard {
  id: string;
  type: CardType;
  front: string;
  back: string;
}

export interface Scenario {
  id: string;
  setup: string;
  question: string;
  modelAnswer: string;
  rubric: string[];
  difficulty: 1 | 2 | 3;
}

export interface Concept {
  id: string;
  chapterId: string;
  title: string;
  isLandmark: boolean;
  order: number;
  pretest: { prompt: string; modelAnswer: string };
  lesson: { markdown: string; readingTimeMin: number };
  workedExample: { setup: string; walkthrough: string };
  contrast: { neighborConceptId: string; explanation: string };
  flashcards: Flashcard[];
  scenarios: Scenario[];
  teachback: { prompt: string; rubric: string[] };
}

export interface Chapter {
  id: string;
  number: number;
  slug: string;
  title: string;
  summary: string;
  concepts: Concept[];
}
