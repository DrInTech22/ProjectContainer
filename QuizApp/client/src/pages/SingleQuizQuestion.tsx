import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { TrueFalseQuestion, MCQQuestion, QuizAnswer } from "@/lib/types";
import { CheckCircle, XCircle, ChevronRight, ChevronLeft, Clock, RotateCcw } from "lucide-react";
import { useActiveQuiz } from "@/hooks/useActiveQuiz";

// Helper function to get ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
function getOrdinalSuffix(n: number): string {
  if (n >= 11 && n <= 13) return "th";
  
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

interface SingleQuizQuestionProps {
  question: TrueFalseQuestion | MCQQuestion;
  questionNumber: number;
  totalQuestions: number;
  onNext: (answer: QuizAnswer) => void;
  onPrevious?: () => void; // Optional for practice mode
  addAnswer: (answer: QuizAnswer) => void;
  showFeedback?: boolean; // For practice mode immediate feedback
  existingAnswer?: QuizAnswer; // For previously answered questions
  canNavigateBack?: boolean; // For practice mode
}

export default function SingleQuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  onNext,
  onPrevious,
  addAnswer,
  showFeedback = false,
  existingAnswer,
  canNavigateBack = false
}: SingleQuizQuestionProps) {
  // Safety check - if question is undefined, show a loading state
  if (!question) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <p>Loading question...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  const { quizSettings, getQuestionAttempts, questionTimerValue, quizAnswers, activeQuiz, practiceQuizCompleted } = useActiveQuiz();
  // Define mode variables first since they are used in useEffect
  const isPracticeMode = quizSettings.mode === "practice";
  const isTimedMode = quizSettings.mode === "timed";
  
  // Calculate the number of correctly answered questions for practice mode
  const correctlyAnsweredCount = useMemo(() => {
    if (!isPracticeMode || !activeQuiz) return 0;
    
    // Get original questions from the quiz (before any repeats)
    const originalQuestions = activeQuiz.content.questions || [];
    const correctAnswers = quizAnswers.filter(a => a.isCorrect);
    
    // Count how many original questions have been answered correctly at least once
    return originalQuestions.filter(q => 
      correctAnswers.some(a => a.questionId === q.id)
    ).length;
  }, [isPracticeMode, activeQuiz, quizAnswers]);
  
  const [selectedAnswer, setSelectedAnswer] = useState<string>(existingAnswer?.answer || "");
  const [submittedAnswer, setSubmittedAnswer] = useState<string | null>(showFeedback ? existingAnswer?.answer || null : null);
  const [answerStartTime, setAnswerStartTime] = useState<number>(Date.now());
  
  // Get attempt count for practice mode
  const attemptCount = getQuestionAttempts(question.id);
  
  // Update state when existingAnswer changes (e.g., when navigating between questions)
  useEffect(() => {
    console.log(`Question ${question.id} mounted/updated`);
    console.log(`Existing answer:`, existingAnswer);
    console.log(`Is practice mode: ${isPracticeMode}`);
    console.log(`Show feedback: ${showFeedback}`);
    
    // For practice mode, if the question is being repeated due to an incorrect answer,
    // we want to reset the UI state as if it's a new question
    if (isPracticeMode && existingAnswer && !existingAnswer.isCorrect) {
      console.log(`Practice mode - resetting state for repeated incorrect question`);
      // Reset for repeated practice questions
      setSelectedAnswer("");
      setSubmittedAnswer(null);
      
    } else if (existingAnswer) {
      console.log(`Question has existing answer: ${existingAnswer.answer}, show feedback: ${showFeedback}`);
      // Normal behavior for questions with existing answers
      setSelectedAnswer(existingAnswer.answer);
      
      // Set submittedAnswer based on showFeedback prop 
      // Show feedback will be true for practice mode and navigation in standard mode
      if (showFeedback) {
        console.log("Setting submitted answer for feedback");
        setSubmittedAnswer(existingAnswer.answer);
      } else {
        setSubmittedAnswer(null);
      }
    } else {
      // First time seeing this question
      console.log("First time seeing this question - resetting state");
      setSelectedAnswer("");
      setSubmittedAnswer(null);
    }
    
    // Reset the answer start time when navigating to a new question
    setAnswerStartTime(Date.now());
    
  }, [existingAnswer, question.id, showFeedback, isPracticeMode]);
  
  // Record when the component mounts to track time spent on question
  useEffect(() => {
    setAnswerStartTime(Date.now());
  }, [question.id]);
  
  // Check if this is a correct answer
  const isCorrect = useMemo(() => {
    if (question.type === "true_false") {
      return selectedAnswer === question.correct_answer;
    } else if (question.type === "mcq") {
      return selectedAnswer === question.correct_answer;
    }
    return false;
  }, [question, selectedAnswer]);
  
  // Handle submitting an answer
  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return;
    
    console.log("=== handleSubmitAnswer called ===");
    console.log(`Submitting answer: ${selectedAnswer}`);
    console.log(`Answer is correct: ${isCorrect}`);
    
    // Calculate time spent
    const timeSpent = Date.now() - answerStartTime;
    console.log(`Time spent on question: ${timeSpent}ms`);
    
    // Create an answer object
    const answer: QuizAnswer = {
      questionId: question.id,
      answer: selectedAnswer,
      isCorrect,
      timeSpent
    };
    
    console.log("Answer object prepared", answer);
    console.log("Setting submitted answer for feedback");
    
    // IMPORTANT: First set the UI state
    // This ensures the component has its local state updated before any global state changes
    setSubmittedAnswer(selectedAnswer);
    
    // DIFFERENT HANDLING FOR EACH QUIZ MODE
    
    // In practice mode, if the answer is correct, record it now
    // If incorrect, we'll record it when they click "Next Question"
    if (isPracticeMode) {
      if (isCorrect) {
        console.log("Practice mode with correct answer - recording immediately");
        addAnswer(answer);
      } else {
        console.log("Practice mode with incorrect answer - will record when Next is clicked");
      }
    }
    // In timed mode, record the answer
    else if (isTimedMode) {
      console.log("Timed mode - recording answer");
      addAnswer(answer);
      
      // Auto-advance is now handled by the quiz timer
    }
    // In standard mode, record the answer but wait for "Next Question" button
    else {
      console.log("Standard mode - recording answer and showing feedback");
      // Immediately add the answer to reduce glitching - we'll ensure it's added
      // again on Next Button click to be absolutely certain
      addAnswer(answer);
    }
  };
  
  // Helper to show the question type
  const getQuestionTypeLabel = () => {
    return question.type === "true_false" ? "True/False Question" : "Multiple Choice Question";
  };
  
  // Special handling for "End Practice" button
  const showEndPracticeButton = isPracticeMode && 
    correctlyAnsweredCount === totalQuestions && 
    isCorrect;
  
  return (
    <Card className="max-w-3xl mx-auto">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-sm font-medium text-gray-500">
            {getQuestionTypeLabel()}
          </h3>
          
          <div className="flex items-center space-x-2">
            {isPracticeMode && (
              <Badge 
                variant={(submittedAnswer && isCorrect) ? "outline" : (submittedAnswer ? "destructive" : "outline")}
                className={(submittedAnswer && isCorrect) ? "bg-green-100 text-green-800 ml-2" : "ml-2"}
              >
                {attemptCount > 0 && `Attempt ${attemptCount}`}
                {attemptCount === 0 && "New Question"}
              </Badge>
            )}
            
            {/* Only show question numbers in Standard and Timed modes */}
            {!isPracticeMode && (
              <div className="text-sm font-medium">
                Question {questionNumber} of {totalQuestions}
              </div>
            )}
          </div>
        </div>
        
        {isPracticeMode && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress: {correctlyAnsweredCount}/{totalQuestions} Mastered</span>
            </div>
            <Progress value={(correctlyAnsweredCount / totalQuestions) * 100} />
          </div>
        )}
        
        <div className="space-y-6">
          <div className="text-xl font-semibold">{question.question}</div>
          
          <div>
            {question.type === "true_false" ? (
              <RadioGroup
                value={selectedAnswer}
                onValueChange={setSelectedAnswer}
                disabled={submittedAnswer !== null}
              >
                <div className="flex flex-col space-y-3">
                  <div className={cn(
                    "flex items-center space-x-2 rounded-md border p-3",
                    isPracticeMode && submittedAnswer !== null && submittedAnswer === "True" && isCorrect && "bg-green-50 border-green-200",
                    isPracticeMode && submittedAnswer !== null && submittedAnswer === "True" && !isCorrect && "bg-red-50 border-red-200",
                    submittedAnswer === null && "hover:bg-gray-50",
                    !isPracticeMode && submittedAnswer !== null && "bg-gray-50"
                  )}>
                    <RadioGroupItem value="True" id="true" />
                    <Label htmlFor="true" className="flex-1 cursor-pointer">True</Label>
                    {isPracticeMode && submittedAnswer === "True" && isCorrect && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {isPracticeMode && submittedAnswer === "True" && !isCorrect && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  
                  <div className={cn(
                    "flex items-center space-x-2 rounded-md border p-3",
                    isPracticeMode && submittedAnswer !== null && submittedAnswer === "False" && isCorrect && "bg-green-50 border-green-200",
                    isPracticeMode && submittedAnswer !== null && submittedAnswer === "False" && !isCorrect && "bg-red-50 border-red-200",
                    submittedAnswer === null && "hover:bg-gray-50",
                    !isPracticeMode && submittedAnswer !== null && "bg-gray-50"
                  )}>
                    <RadioGroupItem value="False" id="false" />
                    <Label htmlFor="false" className="flex-1 cursor-pointer">False</Label>
                    {isPracticeMode && submittedAnswer === "False" && isCorrect && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {isPracticeMode && submittedAnswer === "False" && !isCorrect && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
              </RadioGroup>
            ) : (
              <RadioGroup
                value={selectedAnswer}
                onValueChange={setSelectedAnswer}
                disabled={submittedAnswer !== null}
              >
                <div className="flex flex-col space-y-3">
                  {Object.entries(question.options).map(([optionKey, optionText]) => (
                    <div
                      key={optionKey}
                      className={cn(
                        "flex items-center space-x-2 rounded-md border p-3",
                        isPracticeMode && submittedAnswer !== null && submittedAnswer === optionKey && isCorrect && "bg-green-50 border-green-200",
                        isPracticeMode && submittedAnswer !== null && submittedAnswer === optionKey && !isCorrect && "bg-red-50 border-red-200",
                        submittedAnswer === null && "hover:bg-gray-50",
                        !isPracticeMode && submittedAnswer !== null && "bg-gray-50"
                      )}
                    >
                      <RadioGroupItem value={optionKey} id={optionKey} />
                      <Label htmlFor={optionKey} className="flex-1 cursor-pointer">
                        {optionKey}: {optionText}
                      </Label>
                      {isPracticeMode && submittedAnswer === optionKey && isCorrect && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {isPracticeMode && submittedAnswer === optionKey && !isCorrect && (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}
          </div>
          
          <div className="flex justify-between pt-4">
            {/* Only show Previous button in Standard mode */}
            {!isPracticeMode && !isTimedMode && canNavigateBack && onPrevious && (
              <Button variant="outline" onClick={onPrevious}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous Question
              </Button>
            )}
            
            <div className="flex-1 flex justify-end">
              {submittedAnswer === null ? (
                <Button 
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer}
                >
                  Submit Answer
                </Button>
              ) : (
                <div className="flex flex-col space-y-2">
                  {/* Show different buttons based on quiz mode */}
                  {showEndPracticeButton ? (
                    <Button 
                      onClick={() => {
                        console.log("=== END PRACTICE BUTTON CLICKED ===");
                        // Create a special answer object with a flag that ActiveQuiz will recognize
                        const finalAnswer = {
                          questionId: question.id,
                          answer: selectedAnswer,
                          isCorrect: true,
                          timeSpent: Date.now() - answerStartTime,
                          isEndPracticeButton: true // Special flag to force end
                        };
                        
                        // Use the normal onNext function to ensure the ActiveQuiz context is preserved
                        onNext(finalAnswer as any);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      End Practice
                    </Button>
                  ) : (
                    // Show Next button for all modes
                    // Each mode handles navigation slightly differently
                    (
                      <Button 
                        onClick={() => {
                          console.log("=== Next Question button clicked ===");
                          console.log(`Current question number: ${questionNumber}, Total: ${totalQuestions}`);
                          console.log(`Question ID: ${question.id}, Answer: ${selectedAnswer}`);
                          console.log(`Is answer correct: ${isCorrect}`);
                          
                          // Create a fresh answer object
                          const answer: QuizAnswer = {
                            questionId: question.id,
                            answer: selectedAnswer,
                            isCorrect,
                            timeSpent: Date.now() - answerStartTime
                          };
                          
                          // Mode-specific logic for the Next button
                          if (isPracticeMode) {
                            // Practice Mode
                            
                            // If this is an incorrect answer in practice mode, we need to record it now
                            // (we delayed it earlier to ensure proper feedback)
                            if (!isCorrect) {
                              console.log("Practice mode with incorrect answer - recording now");
                              addAnswer(answer);
                            }
                            console.log("Practice mode - proceeding to next question or results");
                            // Important: Use setTimeout to ensure all state changes are complete
                            // This prevents the race condition in the UI
                            setTimeout(() => {
                              onNext(answer);
                            }, 20);
                          }
                          else if (isTimedMode) {
                            // Timed Mode - only need to handle manually clicked "Next" button
                            // since auto-advance is handled in handleSubmitAnswer
                            console.log("Timed mode - manual next button clicked");
                            setTimeout(() => {
                              onNext(answer);
                            }, 20);
                          }
                          // Standard Mode
                          else {
                            console.log("Standard mode - manual next button clicked");
                            console.log(`Question ${questionNumber} of ${totalQuestions}`);
                            
                            // For Standard mode, we must make sure to add the answer before navigating
                            // This ensures that the last question's answer is recorded
                            addAnswer(answer);
                            
                            // If this is the last question in Standard mode, handle it specially
                            if (questionNumber === totalQuestions) {
                              console.log("Standard mode at last question - proceeding to results");
                              setTimeout(() => {
                                onNext({...answer, isLastQuestion: true});
                              }, 20);
                            } else {
                              setTimeout(() => {
                                onNext(answer);
                              }, 20);
                            }
                          }
                          
                          // Reset component state regardless of mode
                          console.log("Resetting component state in preparation for next question");
                          setSelectedAnswer("");
                          setSubmittedAnswer(null);
                        }}
                      >
                        {isPracticeMode ? "Next Question" : 
                          (questionNumber < totalQuestions ? "Next Question" : "Finish Quiz")}
                        
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}