export type Domain = "dates_venues" | "stats_streaks" | "catchphrases_attire" | "wtf_moments" | "guests_cameos" | "milestones" | "storylines";

export type TriviaQuestion = {
  id: string;
  level: 1 | 2 | 3 | 4 | 5;
  domain: Domain;
  question: string;
  answer: string;
  eraTag: string;
  distractors: string[];
  usedCount: number;
};

export type ScoreEntry = {
  name: string;
  level: number;
  score: number;
  total: number;
  durationSec: number;
  at: number;
};
