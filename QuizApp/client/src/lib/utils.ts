import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string into a human-readable format
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Counts question types in a quiz
 */
export function countQuestionTypes(questions: any[]) {
  const tfCount = questions.filter(q => q.type === "true_false").length;
  const mcqCount = questions.filter(q => q.type === "mcq").length;
  
  return {
    total: questions.length,
    trueFalse: tfCount,
    mcq: mcqCount
  };
}

/**
 * Calculates percentage score and formats it
 */
export function calculatePercentage(correct: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((correct / total) * 100)}%`;
}

/**
 * Parses formatted quiz text and extracts questions and answers
 * This is a backup implementation for client-side processing when needed
 */
export function parseQuizText(text: string): any {
  try {
    // Initialize result
    const result = {
      questions: [] as any[],
    };

    // Split into sections
    const sections = text.split(/\n(?=True\/False:|Multiple Choice Questions:|Answers:)/i);
    
    let trueFalseSection = "";
    let mcqSection = "";
    let answersSection = "";
    
    // Identify sections
    sections.forEach(section => {
      const trimmed = section.trim();
      if (/^True\/False:/i.test(trimmed)) {
        trueFalseSection = trimmed;
      } else if (/^Multiple Choice Questions:/i.test(trimmed)) {
        mcqSection = trimmed;
      } else if (/^Answers:/i.test(trimmed)) {
        answersSection = trimmed;
      }
    });
    
    // Parse answers section to use later
    const answerMap = new Map<number, string>();
    if (answersSection) {
      const answerLines = answersSection.replace(/^Answers:/i, "").trim().split("\n");
      answerLines.forEach(line => {
        const match = line.match(/^(\d+)\.\s*(.+)$/);
        if (match) {
          const questionNumber = parseInt(match[1]);
          const answer = match[2].trim();
          answerMap.set(questionNumber, answer);
        }
      });
    }
    
    // Parse true/false questions
    if (trueFalseSection) {
      const tfLines = trueFalseSection.replace(/^True\/False:/i, "").trim().split("\n");
      
      tfLines.forEach(line => {
        const match = line.match(/^(\d+)\.\s+(.+?)\s*(?:\((False|True)\))?\.?$/i);
        if (match) {
          const id = parseInt(match[1]);
          const question = match[2].trim();
          
          // Check for inline answer
          let answer = match[3];
          
          // If no inline answer, check answers section
          if (!answer && answerMap.has(id)) {
            answer = answerMap.get(id);
          }
          
          // Default to True if no answer found
          answer = answer || "True";
          
          result.questions.push({
            id,
            type: "true_false",
            question,
            correct_answer: answer
          });
        }
      });
    }
    
    // Parse MCQs
    if (mcqSection) {
      const mcqLines = mcqSection.replace(/^Multiple Choice Questions:/i, "").trim().split("\n");
      
      let currentQuestion: any = null;
      
      mcqLines.forEach(line => {
        // Check if new question
        const questionMatch = line.match(/^(\d+)\.\s+(.+?):$/);
        if (questionMatch) {
          // Save previous question if exists
          if (currentQuestion) {
            result.questions.push(currentQuestion);
          }
          
          const id = parseInt(questionMatch[1]);
          const questionText = questionMatch[2].trim();
          
          currentQuestion = {
            id,
            type: "mcq",
            question: questionText,
            options: {},
            correct_answer: ""
          };
          
          // Check answer from answers section
          if (answerMap.has(id)) {
            currentQuestion.correct_answer = answerMap.get(id) || "";
          }
        } 
        // Check if option for current question
        else if (currentQuestion) {
          const optionMatch = line.match(/([a-z])\)\s+(.+)/i);
          if (optionMatch) {
            const optionLetter = optionMatch[1].toLowerCase();
            const optionText = optionMatch[2].trim();
            
            currentQuestion.options[optionLetter] = optionText;
          }
        }
      });
      
      // Add last question
      if (currentQuestion) {
        result.questions.push(currentQuestion);
      }
    }
    
    return result;
  } catch (error) {
    console.error("Error parsing quiz text:", error);
    return { questions: [] };
  }
}
