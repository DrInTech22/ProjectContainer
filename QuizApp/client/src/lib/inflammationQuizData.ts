/**
 * Hardcoded quiz data for the inflammation quiz
 */
import { QuizContent } from "./types";

export const inflammationQuizData: QuizContent = {
  topic: "Inflammation Biology",
  questions: [
    {
      id: 1,
      type: "true_false",
      question: "Inflammation is a response of non-vascularized tissues to infections and damaged tissue.",
      correct_answer: "False"
    },
    {
      id: 2,
      type: "true_false",
      question: "The primary purpose of inflammation is to eliminate offending agents at the site of injury.",
      correct_answer: "True"
    },
    {
      id: 3,
      type: "true_false",
      question: "Without inflammation, infections would be effectively controlled by the body's innate immune responses.",
      correct_answer: "False"
    },
    {
      id: 4,
      type: "true_false",
      question: "Natural killer cells are the only components of innate immunity providing the first response to infection.",
      correct_answer: "False"
    },
    {
      id: 5,
      type: "true_false",
      question: "The third step in a typical inflammatory reaction is the recognition of the offending agent.",
      correct_answer: "False"
    },
    {
      id: 6,
      type: "true_false",
      question: "Acute inflammation is characterized by the presence of lymphocytes and macrophages.",
      correct_answer: "False"
    },
    {
      id: 7,
      type: "true_false",
      question: "Rubor, tumor, calor, and dolor are the cardinal signs of chronic inflammation.",
      correct_answer: "False"
    },
    {
      id: 8,
      type: "true_false",
      question: "Ischemia, trauma, and infections can be causes of inflammation.",
      correct_answer: "True"
    },
    {
      id: 9,
      type: "true_false",
      question: "Hypersensitivity reactions, including allergies and autoimmune diseases, can lead to inflammation.",
      correct_answer: "True"
    },
    {
      id: 10,
      type: "true_false",
      question: "Acute inflammation is a slow response that develops over several days.",
      correct_answer: "False"
    },
    {
      id: 11,
      type: "mcq",
      question: "Which of the following is the primary definition of inflammation?",
      options: {
        "a": "A process of tissue repair and regeneration.",
        "b": "A response of vascularized tissues to infection and damage.",
        "c": "A localized increase in blood flow without immune cell involvement.",
        "d": "A chronic condition characterized by persistent pain and swelling."
      },
      correct_answer: "b"
    },
    {
      id: 12,
      type: "mcq",
      question: "Which of the following components of innate immunity provides the first response to infection, apart from leukocytes?",
      options: {
        "a": "B lymphocytes",
        "b": "T lymphocytes",
        "c": "Plasma cells",
        "d": "Dendritic cells"
      },
      correct_answer: "d"
    },
    {
      id: 13,
      type: "mcq",
      question: "Which of the following is NOT a typical step in the development of an inflammatory reaction?",
      options: {
        "a": "Recognition of the offending agent.",
        "b": "Proliferation of fibroblasts at the site of injury.",
        "c": "Recruitment of leukocytes and plasma proteins.",
        "d": "Elimination of the offending substance."
      },
      correct_answer: "b"
    },
    {
      id: 14,
      type: "mcq",
      question: "Which of the following is characteristic of acute inflammation?",
      options: {
        "a": "Predominance of lymphocytes and macrophages.",
        "b": "Extensive deposition of connective tissue.",
        "c": "Exudation of fluid and plasma proteins.",
        "d": "Slow onset and long duration."
      },
      correct_answer: "c"
    },
    {
      id: 15,
      type: "mcq",
      question: "Which of the following is a cardinal sign of inflammation?",
      options: {
        "a": "Cyanosis (bluish discoloration)",
        "b": "Jaundice (yellowish discoloration)",
        "c": "Rubor (redness)",
        "d": "Pallor (paleness)"
      },
      correct_answer: "c"
    }
  ]
};

export const getInflammationQuiz = (): QuizContent => {
  return JSON.parse(JSON.stringify(inflammationQuizData));
};