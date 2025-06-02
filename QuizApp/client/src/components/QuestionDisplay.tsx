
import { TrueFalseQuestion, MCQQuestion, QuizAnswer } from "@/lib/types";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface QuestionDisplayProps {
  question: TrueFalseQuestion | MCQQuestion;
  index: number;
  showResults?: boolean;
  answer?: QuizAnswer;
  onAnswerChange?: (answer: QuizAnswer) => void;
}

export default function QuestionDisplay({
  question,
  index,
  showResults = false,
  answer,
  onAnswerChange
}: QuestionDisplayProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>(answer?.answer || "");

  useEffect(() => {
    if (answer) {
      setSelectedAnswer(answer.answer);
    }
  }, [answer]);

  const handleAnswerChange = (value: string) => {
    setSelectedAnswer(value);
    if (onAnswerChange) {
      onAnswerChange({
        questionId: question.id,
        answer: value,
        isCorrect: value === question.correct_answer
      });
    }
  };

  const isCorrect = answer?.isCorrect ?? false;
  const correctAnswer = question.correct_answer;
  const userAnswer = answer?.answer ?? '';

  const getAnswerStyle = (answerValue: string) => {
    if (!showResults) return "";
    if (correctAnswer === answerValue) return "text-success font-medium";
    if (userAnswer === answerValue && userAnswer !== correctAnswer) return "text-error font-medium";
    return "";
  };

  return (
    <div className={cn(
      "bg-gray-50 dark:bg-gray-800 rounded-lg p-5 transition-all",
      showResults && (isCorrect ? "border-2 border-success" : "border-2 border-error")
    )}>
      <h3 className="font-medium text-lg mb-1 flex items-center justify-between">
        <span>
          Question {index + 1}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
            ({question.type === "true_false" ? "True/False" : "Multiple Choice"})
          </span>
        </span>
        {showResults && (
          <span className={cn(
            "flex items-center text-sm px-2 py-1 rounded",
            isCorrect ? "text-success bg-success/10" : "text-error bg-error/10"
          )}>
            {isCorrect ? (
              <CheckCircle className="h-4 w-4 mr-1" />
            ) : (
              <XCircle className="h-4 w-4 mr-1" />
            )}
            {isCorrect ? "Correct" : "Incorrect"}
          </span>
        )}
      </h3>

      <p className="mb-4">{question.question}</p>

      {question.type === "true_false" ? (
        <RadioGroup
          value={selectedAnswer}
          onValueChange={handleAnswerChange}
          disabled={showResults}
          className="flex items-center space-x-6 mt-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="True" id={`true-${question.id}`} />
            <Label 
              htmlFor={`true-${question.id}`}
              className={getAnswerStyle("True")}
            >
              True
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="False" id={`false-${question.id}`} />
            <Label 
              htmlFor={`false-${question.id}`}
              className={getAnswerStyle("False")}
            >
              False
            </Label>
          </div>
        </RadioGroup>
      ) : (
        <RadioGroup
          value={selectedAnswer}
          onValueChange={handleAnswerChange}
          disabled={showResults}
          className="space-y-3 mt-3"
        >
          {Object.entries((question as MCQQuestion).options).map(([key, value]) => (
            <div key={key} className="flex items-center space-x-2">
              <RadioGroupItem value={key} id={`option-${question.id}-${key}`} />
              <Label 
                htmlFor={`option-${question.id}-${key}`}
                className={getAnswerStyle(key)}
              >
                {key}) {value}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {showResults && (
        <div className="answer-feedback mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          {isCorrect ? (
            <div className="flex items-center text-success">
              <CheckCircle className="h-5 w-5 mr-1" />
              <span>Correct answer!</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center text-error">
                <XCircle className="h-5 w-5 mr-1" />
                <span>Incorrect answer</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Correct answer: {question.type === "mcq" 
                  ? `${correctAnswer}) ${(question as MCQQuestion).options[correctAnswer]}`
                  : correctAnswer
                }
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
