import { QuizContent, TrueFalseQuestion, MCQQuestion } from "./types";

/**
 * Parse raw quiz text into structured quiz content
 */
export async function parseQuizText(text: string, title: string = ""): Promise<QuizContent> {
  try {
    const response = await fetch("/api/parse-quiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, title }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to parse quiz text");
    }

    return await response.json();
  } catch (error) {
    console.error("Error parsing quiz:", error);
    throw error;
  }
}

/**
 * Count the number of questions by type in a quiz
 */
export function countQuestionTypes(questions: (TrueFalseQuestion | MCQQuestion)[]) {
  const trueFalseCount = questions.filter(q => q.type === "true_false").length;
  const mcqCount = questions.filter(q => q.type === "mcq").length;
  
  return {
    total: questions.length,
    trueFalse: trueFalseCount,
    mcq: mcqCount
  };
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
