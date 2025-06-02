export interface QuizQuestion {
  id: number;
  type: "true_false" | "mcq";
  question: string;
  correct_answer: string;
}

export interface TrueFalseQuestion extends QuizQuestion {
  type: "true_false";
  correct_answer: "True" | "False";
}

export interface MCQQuestion extends QuizQuestion {
  type: "mcq";
  options: Record<string, string>;
  correct_answer: string;
}

export type QuizMode = "standard" | "practice" | "timed";

export interface QuizSettings {
  mode: QuizMode;
  timePerQuestion: number; // in seconds
  questionCount: number | null; // null means use all questions
  shuffleQuestions: boolean;
  immediateReview: boolean; // show answers immediately in practice mode
}

export interface QuizContent {
  topic: string;
  questions: (TrueFalseQuestion | MCQQuestion)[];
}

export interface Quiz {
  id: number;
  title: string;
  topic: string;
  created_at: string;
  content: QuizContent;
}

export interface QuizAnswer {
  questionId: number;
  answer: string;
  isCorrect?: boolean;
  timeSpent?: number; // time spent in ms to answer this question
  attemptCount?: number; // used for practice mode to track retries
  _scheduledForRepeat?: boolean; // internal flag used to track if a failed question has been scheduled
}

export interface QuizResult {
  quizId: number;
  title: string;
  totalQuestions: number;
  correctAnswers: number;
  answers: QuizAnswer[];
  date: string;
  quizMode: QuizMode;
  totalTimeSpent: number; // total time in ms
  averageTimePerQuestion: number; // average time per question in ms
}

// Default quiz settings
export const DEFAULT_QUIZ_SETTINGS: QuizSettings = {
  mode: "standard",
  timePerQuestion: 30, // 30 seconds per question by default
  questionCount: null, // use all questions
  shuffleQuestions: false,
  immediateReview: false
};
