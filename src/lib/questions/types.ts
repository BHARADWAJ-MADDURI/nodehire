export type QuestionMode = "drill" | "mock";
export type QuestionDifficulty = "easy" | "medium" | "hard";

export type GeneratedQuestion = {
  questionText: string;
  evaluationRubric: { dimensions: string[]; strongAnswerSignals: string[] };
  followUpHints: string[];
};

export type RuntimeContext = {
  company: string;
  role: string;
  framing: string;
};
