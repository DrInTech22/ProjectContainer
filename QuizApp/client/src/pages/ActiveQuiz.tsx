import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { LoaderCircle, Sparkles, BookOpen, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useActiveQuiz } from "@/hooks/useActiveQuiz";
import { useQuizzes } from "@/hooks/useQuizzes";
import SingleQuizQuestion from "./SingleQuizQuestion";
import QuizTimer from "@/components/QuizTimer";
import { QuizAnswer, Quiz } from "@/lib/types";

export default function ActiveQuiz() {
  const [, params] = useRoute("/take-quiz/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { quizzes, isLoading } = useQuizzes();
  
  const activeQuizContext = useActiveQuiz();
  const { 
    activeQuiz, 
    setActiveQuiz, 
    quizAnswers, 
    addAnswer, 
    resetQuiz,
    checkAnswers,
    quizSettings,
    currentQuestionIndex,
    navigateToQuestion,
    questionTimerValue,
    isTimerRunning,
    startQuizTimer,
    pauseQuizTimer,
    quizQuestions,
    setQuizQuestions,
    practiceQuizCompleted // Include practiceQuizCompleted flag
  } = activeQuizContext;
  
  // Use this effect to load the quiz when the component mounts
  useEffect(() => {
    if (params?.id) {
      const quizId = parseInt(params.id);
      
      if (quizzes) {
        const quiz = quizzes.find((q: Quiz) => q.id === quizId);
        if (quiz) {
          setActiveQuiz(quiz);
        } else {
          toast({
            title: "Error",
            description: "Quiz not found",
            variant: "destructive",
          });
          navigate("/");
        }
      }
    }
  }, [params?.id, quizzes, setActiveQuiz, toast, navigate]);
  
  // Start the timer when the component mounts - only for Timed Mode
  // Start the timer only for Timed Mode
  useEffect(() => {
    // Only start the timer if we're in Timed Mode
    if (activeQuiz && quizSettings.mode === "timed") {
      console.log("Starting quiz timer for Timed Mode");
      startQuizTimer();
    }
    
    // Cleanup timer when component unmounts
    return () => {
      if (quizSettings.mode === "timed") {
        console.log("Cleaning up timer for Timed Mode");
        pauseQuizTimer();
      }
    };
  }, [activeQuiz, quizSettings.mode, startQuizTimer, pauseQuizTimer]);
  
  const handleNext = (answer: QuizAnswer) => {
    console.log("=== handleNext called ===");
    console.log(`Current Question Index: ${currentQuestionIndex}`);
    console.log(`Total Questions: ${quizQuestions.length}`);
    console.log(`Answer correct?: ${answer.isCorrect}`);
    console.log(`Quiz mode: ${quizSettings.mode}`);
    
    // DIRECT PATH FOR END PRACTICE BUTTON 
    // Check for the special flag we added in SingleQuizQuestion
    if ((answer as any).isEndPracticeButton === true) {
      console.log("END PRACTICE SPECIAL PATH: Button was clicked with special flag");
      console.log("Processing practice mode completion...");
      
      // Ensure we have the right results
      // 1. Calculate stats for correctness and time
      // 2. Make sure to only include original questions, not repeats
      
      if (activeQuiz && quizSettings.mode === "practice") {
        // Get only unique questions from original quiz
        const originalQuestions = activeQuiz.content.questions || [];
        const correctAnswers = quizAnswers.filter(a => a.isCorrect);
        
        // Create a set of correctly answered question IDs
        const correctQuestionIds = new Set();
        correctAnswers.forEach(a => correctQuestionIds.add(a.questionId));
        
        console.log(`Practice mode completion: ${correctQuestionIds.size}/${originalQuestions.length} questions mastered`);
        
        // Ensure we have quiz results
        checkAnswers();
        
        // Note: We don't have setPracticeQuizCompleted in our destructured variables
        // The practice completion will be detected by the useEffect in useActiveQuiz.tsx
        
        // Navigate to results
        console.log("Navigating to results page...");
        navigate("/quiz-results");
        return;
      } else {
        // Fallback if somehow context is lost
        console.warn("No active quiz or not in practice mode - using simple approach");
        checkAnswers();
        navigate("/quiz-results");
        return;
      }
    }
    
    try {
      // Practice mode with incorrect answers - add the question back in the queue
      if (quizSettings.mode === "practice" && !answer.isCorrect) {
        console.log("PRACTICE MODE: Scheduling failed question for repeat");
        
        // Get the current question object that was answered incorrectly
        const incorrectQuestion = quizQuestions[currentQuestionIndex];
        
        if (incorrectQuestion) {
          // Create a deep copy to avoid reference issues
          const questionCopy = JSON.parse(JSON.stringify(incorrectQuestion));
          
          // Determine where to place the question
          const remainingQuestions = quizQuestions.length - (currentQuestionIndex + 1);
          
          // Place the question either:
          // - If we have 2+ questions ahead: 2-3 questions later
          // - Otherwise: at the end
          if (remainingQuestions >= 2) {
            // Randomly choose to place 2-3 questions later
            const delayCount = Math.floor(Math.random() * 2) + 2; // 2-3
            const insertPosition = currentQuestionIndex + delayCount;
            
            console.log(`IMPORTANT: Scheduling failed question ${incorrectQuestion.id} to repeat after ${delayCount} questions (position ${insertPosition})`);
            
            // Create new queue with the question inserted at the chosen position
            const updatedQuestions = [
              ...quizQuestions.slice(0, insertPosition),
              questionCopy,
              ...quizQuestions.slice(insertPosition)
            ];
            
            console.log(`Questions queue updated, new length: ${updatedQuestions.length}`);
            setQuizQuestions(updatedQuestions);
          } else {
            // Add it at the end since we don't have enough questions ahead
            console.log(`IMPORTANT: Adding failed question ${incorrectQuestion.id} to the end of the queue`);
            setQuizQuestions([...quizQuestions, questionCopy]);
          }
        }
      }
      
      // Check if we're at the last question or if we have an explicit flag
      console.log(`Checking if at last question: currentIndex=${currentQuestionIndex}, length=${quizQuestions.length}`);
      
      // Check for explicit "last question" flag from SingleQuizQuestion component
      if ((answer as any).isLastQuestion === true && quizSettings.mode === "standard") {
        console.log("Standard mode: Explicit last question flag received");
        console.log("Standard mode: Finalizing quiz and navigating to results");
        
        // Add the answer (already done in component but double-check)
        const answerExists = quizAnswers.some(a => a.questionId === answer.questionId);
        if (!answerExists) {
          addAnswer(answer);
        }
        
        // Use direct state updates like practice mode
        checkAnswers();
        console.log("Standard mode: Navigation to results...");
        navigate("/quiz-results");
        return;
      }
      
      // Get the total number of original questions
      const totalOriginalQuestions = activeQuiz?.content?.questions?.length || 0;
      
      // Standard mode - improved logic based on practice mode pattern
      if (quizSettings.mode === "standard") {
        console.log(`Standard mode check: currentIndex=${currentQuestionIndex}, totalQuestions=${totalOriginalQuestions}`);
        
        // Check if we're at the last question
        if (currentQuestionIndex + 1 >= totalOriginalQuestions) {
          console.log("Standard mode: At the last question - proceeding to results");
          
          // Ensure the answer is added
          const answerExists = quizAnswers.some(a => a.questionId === answer.questionId);
          if (!answerExists) {
            addAnswer(answer);
          }
          
          // Set completion flag
          console.log("Standard mode: Setting completion state");
          
          // Complete results calculation
          checkAnswers();
          
          // Navigate to results page
          console.log("Standard mode: Final navigation to results page");
          navigate("/quiz-results");
          return;
        } else {
          // Not at the last question, just go to the next one
          console.log(`Standard mode: Not at last question (${currentQuestionIndex + 1}/${totalOriginalQuestions})`);
          navigateToQuestion(currentQuestionIndex + 1);
          return;
        }
      }
      
      // For Practice and Timed modes, use the more complex logic
      if (currentQuestionIndex >= quizQuestions.length - 1) {
        console.log("At last question - should finish quiz");
        console.log(`Quiz mode: ${quizSettings.mode}`);
        console.log(`Question number: ${currentQuestionIndex + 1}, Total: ${totalOriginalQuestions}`);
        
        // Special handling for Practice Mode
        if (quizSettings.mode === "practice" && activeQuiz && activeQuiz.content && activeQuiz.content.questions) {
          console.log(`Practice mode at last question.`);
          
          // **SIMPLEST CHECK** 
          // This is exactly what SingleQuizQuestion uses to show "End Practice" button
          // Count correctly answered questions
          const correctAnswers = quizAnswers.filter(a => a.isCorrect);
          const uniqueCorrectQuestionIds = new Set();
          correctAnswers.forEach(a => uniqueCorrectQuestionIds.add(a.questionId));
          
          // Get total original questions (TypeScript safety handled with guard clause above)
          const totalOriginalQuestions = activeQuiz.content.questions.length;
          
          console.log(`Correctly answered questions: ${uniqueCorrectQuestionIds.size}/${totalOriginalQuestions}`);
          console.log(`Current answer correct? ${answer.isCorrect}`);
          
          // If this condition is true, we're clicking the "End Practice" button
          if (uniqueCorrectQuestionIds.size === totalOriginalQuestions && answer.isCorrect) {
            console.log("END PRACTICE BUTTON CLICKED - All questions mastered!");
            checkAnswers();
            navigate("/quiz-results");
            return;
          }
          
          // If not completed yet and the answer was incorrect, continue practice
          // as we've added the question back into the queue
          if (!answer.isCorrect) {
            console.log("Practice mode: Last question answered incorrectly - continuing quiz");
            navigateToQuestion(currentQuestionIndex + 1);
            return;
          }
          
          // For practice mode, we should only finish if all questions have been answered correctly
          if (uniqueCorrectQuestionIds.size < totalOriginalQuestions) {
            console.log("At last question in Practice Mode but not all questions mastered yet");
            console.log("Staying on current question until all questions are mastered");
            // Since we're at the last question, the practice should continue
            // But we'll stay on the current question until all questions are mastered
            return;
          }
        }
        
        // For standard/timed modes, or when practice is complete, finish the quiz
        console.log("Finishing quiz");
        console.log(`Standard/Timed mode: Final question answered. Answers collected: ${quizAnswers.length}`);
        
        // Make sure we've computed the results before navigating
        checkAnswers();
        console.log("Navigating to results page...");
        navigate("/quiz-results");
        return;
      }
      
      // Always move to the next question
      console.log(`Moving to question ${currentQuestionIndex + 1}`);
      navigateToQuestion(currentQuestionIndex + 1);
      
    } catch (error) {
      console.error("Error in handleNext:", error);
      // Fallback - just try to move to the next question
      if (currentQuestionIndex < quizQuestions.length - 1) {
        navigateToQuestion(currentQuestionIndex + 1);
      }
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      navigateToQuestion(currentQuestionIndex - 1);
    }
  };
  
  // Timed Mode specific: Handle time up for a question
  const handleTimeUp = () => {
    // This function should only be called in Timed Mode
    console.log("=== handleTimeUp called for Timed Mode ===");
    
    // Safety check to ensure we're in timed mode
    if (quizSettings.mode !== "timed") {
      console.log("Warning: handleTimeUp called outside of Timed Mode");
      return;
    }
    
    // Get the current question
    const currentQuestion = quizQuestions[currentQuestionIndex];
    console.log(`Time expired for question ${currentQuestion.id} (index ${currentQuestionIndex})`);
    
    // If not at the last question, move to the next question
    if (currentQuestionIndex < quizQuestions.length - 1) {
      // Create a "timeout" answer if no answer exists yet
      const existingAnswer = quizAnswers.find(a => a.questionId === currentQuestion.id);
      if (!existingAnswer) {
        console.log("No answer submitted before timeout - marking as incorrect");
        addAnswer({
          questionId: currentQuestion.id,
          answer: "", // Empty answer indicates timeout
          isCorrect: false,
          timeSpent: quizSettings.timePerQuestion * 1000
        });
      } else {
        console.log("Answer already exists for this question, using existing answer");
      }
      
      console.log(`Moving to next question (${currentQuestionIndex + 1})`);
      navigateToQuestion(currentQuestionIndex + 1);
    } 
    // If at the last question, finish the quiz
    else {
      console.log("Time expired on last question - finishing quiz");
      checkAnswers();
      navigate("/quiz-results");
    }
  };
  
  if (isLoading || !activeQuiz || quizQuestions.length === 0 || currentQuestionIndex < 0 || currentQuestionIndex >= quizQuestions.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary mb-4" />
        <p>Loading quiz...</p>
      </div>
    );
  }
  
  const currentQuestion = quizQuestions[currentQuestionIndex];
  // Use the stabilized totalQuestionCount from context to prevent UI glitches
  const totalQuestions = activeQuizContext.totalQuestionCount;
  
  // Get any existing answer for this question
  // Add a safety check to prevent access to currentQuestion.id if it doesn't exist
  const existingAnswer = currentQuestion ? 
    quizAnswers.find(a => a.questionId === currentQuestion.id) : 
    undefined;
  
  // In practice mode, we want to show immediate feedback when an answer exists
  // but also when navigating back to already answered questions
  const showImmediateFeedback = quizSettings.mode === "practice" && 
    (existingAnswer !== undefined || currentQuestionIndex < quizAnswers.length);
  
  return (
    <div className="py-8">
      <div className="mb-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold">{activeQuiz.title}</h1>
        <p className="text-gray-500">Topic: {activeQuiz.content.topic}</p>
      </div>
      
      {/* Mode indicator */}
      <div className="max-w-3xl mx-auto mb-4 flex justify-between items-center">
        <div className="px-3 py-1 rounded-full bg-primary/10 text-sm font-medium flex items-center">
          {quizSettings.mode === "standard" && (
            <Sparkles className="h-4 w-4 mr-1.5 text-primary" />
          )}
          {quizSettings.mode === "practice" && (
            <BookOpen className="h-4 w-4 mr-1.5 text-green-500" />
          )}
          {quizSettings.mode === "timed" && (
            <Clock className="h-4 w-4 mr-1.5 text-blue-500" />
          )}
          {quizSettings.mode.charAt(0).toUpperCase() + quizSettings.mode.slice(1)} Mode
        </div>
        
        <div className="text-sm text-gray-500">
          {quizSettings.shuffleQuestions && "Questions are shuffled"}
        </div>
      </div>
      
      {/* Timer for timed mode */}
      {quizSettings.mode === "timed" && (
        <div className="max-w-3xl mx-auto">
          <QuizTimer 
            timeRemaining={questionTimerValue} 
            totalTime={quizSettings.timePerQuestion}
            isRunning={isTimerRunning}
            onTimeUp={handleTimeUp}
          />
        </div>
      )}
      
      {/* Question */}
      <SingleQuizQuestion
        question={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={totalQuestions}
        onNext={handleNext}
        onPrevious={currentQuestionIndex > 0 ? handlePrevious : undefined}
        addAnswer={addAnswer}
        showFeedback={quizSettings.mode === "practice" ? showImmediateFeedback : Boolean(existingAnswer)}
        existingAnswer={existingAnswer}
        canNavigateBack={currentQuestionIndex > 0}
      />
    </div>
  );
}