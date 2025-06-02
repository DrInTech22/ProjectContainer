import { createContext, useState, useContext, ReactNode, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Quiz, QuizAnswer, QuizResult, QuizSettings, QuizMode, TrueFalseQuestion, MCQQuestion } from "@/lib/types";

interface ActiveQuizContextType {
  activeQuiz: Quiz | null;
  setActiveQuiz: (quiz: Quiz | null) => void;
  quizResults: QuizResult | null;
  setQuizResults: (results: QuizResult | null) => void;
  quizAnswers: QuizAnswer[];
  setQuizAnswers: (answers: QuizAnswer[]) => void;
  addAnswer: (answer: QuizAnswer) => void;
  checkAnswers: () => void;
  resetQuiz: () => void;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
  navigateToQuestion: (index: number) => void;
  navigateToPreviousQuestion: () => void; // Added for Practice mode
  quizSettings: QuizSettings;
  setQuizSettings: (settings: QuizSettings) => void;
  quizQuestions: (TrueFalseQuestion | MCQQuestion)[];
  setQuizQuestions: (questions: (TrueFalseQuestion | MCQQuestion)[]) => void;
  totalQuestionCount: number; // Stable question count for UI display
  startQuizTimer: () => void;
  pauseQuizTimer: () => void;
  questionTimerValue: number;
  isTimerRunning: boolean;
  quizStartTime: number | null;
  resetQuizTimer: () => void;
  shouldRepeatQuestion: (questionId: number) => boolean; // Added for Practice mode
  getQuestionAttempts: (questionId: number) => number; // Added for Practice mode
  isLastQuestion: () => boolean; // Helper for navigation
  isFirstQuestion: () => boolean; // Helper for navigation
  getTotalIncorrectAttempts: () => number; // Added for analytics
  practiceQuizCompleted: boolean; // Flag to indicate when practice mode is complete
}

const DEFAULT_QUIZ_SETTINGS: QuizSettings = {
  mode: "standard",
  timePerQuestion: 30, // 30 seconds per question by default
  questionCount: null, // use all questions
  shuffleQuestions: false,
  immediateReview: false
};

const ActiveQuizContext = createContext<ActiveQuizContextType | undefined>(undefined);

export const ActiveQuizProvider = ({ children }: { children: ReactNode }) => {
  const [, navigate] = useLocation();
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(() => {
    const saved = localStorage.getItem('activeQuiz');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [quizResults, setQuizResults] = useState<QuizResult | null>(() => {
    const saved = localStorage.getItem('quizResults');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>(() => {
    const saved = localStorage.getItem('quizAnswers');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  const [quizSettings, setQuizSettings] = useState<QuizSettings>(() => {
    const saved = localStorage.getItem('quizSettings');
    return saved ? JSON.parse(saved) : DEFAULT_QUIZ_SETTINGS;
  });

  const [quizQuestions, setQuizQuestions] = useState<(TrueFalseQuestion | MCQQuestion)[]>([]);
  // Store the original question count separately to maintain consistent UI
  const [originalQuestionCount, setOriginalQuestionCount] = useState<number | null>(null);
  const [questionTimerValue, setQuestionTimerValue] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  
  // Flag for navigation that helps avoid glitches
  const [isNavigating, setIsNavigating] = useState(false);
  // Flag for tracking practice mode completion
  const [practiceQuizCompleted, setPracticeQuizCompleted] = useState(false);
  
  const timerRef = useRef<number | null>(null);
  const questionStartTimeRef = useRef<number | null>(null);

  // Initialize quiz questions when activeQuiz changes
  useEffect(() => {
    if (activeQuiz) {
      let questions = [...activeQuiz.content.questions];
      
      // Apply settings
      if (quizSettings.shuffleQuestions) {
        // Fisher-Yates shuffle algorithm
        for (let i = questions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [questions[i], questions[j]] = [questions[j], questions[i]];
        }
      }
      
      // Limit question count if specified
      if (quizSettings.questionCount && quizSettings.questionCount > 0 && quizSettings.questionCount < questions.length) {
        questions = questions.slice(0, quizSettings.questionCount);
      }
      
      setQuizQuestions(questions);
      // Store the original question count to keep UI consistent during practice mode
      setOriginalQuestionCount(questions.length);
      setCurrentQuestionIndex(0);
      setPracticeQuizCompleted(false);
    }
  }, [activeQuiz, quizSettings.shuffleQuestions, quizSettings.questionCount]);

  // Persist state in localStorage
  useEffect(() => {
    if (activeQuiz) localStorage.setItem('activeQuiz', JSON.stringify(activeQuiz));
    if (quizResults) localStorage.setItem('quizResults', JSON.stringify(quizResults));
    if (quizAnswers.length) localStorage.setItem('quizAnswers', JSON.stringify(quizAnswers));
    localStorage.setItem('quizSettings', JSON.stringify(quizSettings));
  }, [activeQuiz, quizResults, quizAnswers, quizSettings]);

  // Timer function for timed quizzes
  const startQuizTimer = () => {
    if (!isTimerRunning) {
      setIsTimerRunning(true);
      
      // Set start time for entire quiz if not set
      if (quizStartTime === null) {
        setQuizStartTime(Date.now());
      }
      
      // Set start time for current question
      if (questionStartTimeRef.current === null) {
        questionStartTimeRef.current = Date.now();
      }
      
      timerRef.current = window.setInterval(() => {
        // Update the timer display
        const elapsedTime = Math.floor((Date.now() - (questionStartTimeRef.current || 0)) / 1000);
        setQuestionTimerValue(quizSettings.timePerQuestion - elapsedTime);
        
        // Auto-advance when time runs out in timed mode
        if (quizSettings.mode === "timed" && elapsedTime >= quizSettings.timePerQuestion) {
          // Get the current question
          const currentQuestion = quizQuestions[currentQuestionIndex];
          
          // Create a "timeout" answer
          if (currentQuestion) {
            addAnswer({
              questionId: currentQuestion.id,
              answer: "", // Empty answer indicates timeout
              isCorrect: false,
              timeSpent: quizSettings.timePerQuestion * 1000
            });
            
            // Move to next question or end quiz
            navigateToQuestion(currentQuestionIndex + 1);
          }
        }
      }, 1000);
    }
  };

  const pauseQuizTimer = () => {
    if (isTimerRunning && timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setIsTimerRunning(false);
      
      // Record time spent on this question
      if (questionStartTimeRef.current !== null) {
        const timeSpent = Date.now() - questionStartTimeRef.current;
        questionStartTimeRef.current = null;
        return timeSpent;
      }
    }
    return 0;
  };
  
  const resetQuizTimer = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTimerRunning(false);
    setQuestionTimerValue(quizSettings.timePerQuestion);
    questionStartTimeRef.current = null;
    setQuizStartTime(null);
  };

  const addAnswer = (answer: QuizAnswer) => {
    console.log("=== addAnswer called ===");
    console.log(`Question ID: ${answer.questionId}, Answer: ${answer.answer}`);
    
    // Verify the answer against the question
    const question = quizQuestions.find(q => q.id === answer.questionId);
    const isCorrect = question?.correct_answer === answer.answer;
    console.log(`Question found: ${question ? 'Yes' : 'No'}, Is correct: ${isCorrect}`);
    
    // Calculate time spent if not provided
    const timeSpent = answer.timeSpent ?? (questionStartTimeRef.current ? Date.now() - questionStartTimeRef.current : 0);
    
    const verifiedAnswer: QuizAnswer = { 
      ...answer, 
      isCorrect,
      timeSpent 
    };
    
    // Reset question timer for next question
    questionStartTimeRef.current = null;
    
    // For practice mode, we need to handle attempts differently
    if (quizSettings.mode === "practice") {
      console.log("=== Practice mode answer handling ===");
      
      // Find any existing answer for this question
      const existingAnswers = quizAnswers.filter(a => a.questionId === answer.questionId);
      console.log(`Found ${existingAnswers.length} existing answers for this question`);
      
      if (existingAnswers.length > 0) {
        // Get the highest attempt count
        const maxAttempt = Math.max(...existingAnswers.map(a => a.attemptCount || 1));
        console.log(`Current max attempt: ${maxAttempt}`);
        
        // If this is a correct answer after previous attempts, preserve the attempt count
        if (isCorrect && maxAttempt > 0) {
          console.log(`Correct answer after ${maxAttempt} attempts`);
          const newAnswer = { 
            ...verifiedAnswer,
            attemptCount: maxAttempt + 1
          };
          
          // Replace all previous answers for this question since it's now correct
          const otherAnswers = quizAnswers.filter(a => a.questionId !== answer.questionId);
          setQuizAnswers([...otherAnswers, newAnswer]);
        } 
        // If this is another incorrect attempt, increment the attempt count
        else if (!isCorrect) {
          console.log(`Another incorrect attempt, incrementing to ${maxAttempt + 1}`);
          const newAnswer = { 
            ...verifiedAnswer, 
            attemptCount: maxAttempt + 1 
          };
          
          // Add this new attempt to the list
          setQuizAnswers([...quizAnswers, newAnswer]);
        } 
        // If this is a first-time correct answer, just add it
        else {
          console.log('First-time correct answer');
          const newAnswer = { 
            ...verifiedAnswer, 
            attemptCount: 1 
          };
          
          // Replace all previous answers since this one is correct
          const otherAnswers = quizAnswers.filter(a => a.questionId !== answer.questionId);
          setQuizAnswers([...otherAnswers, newAnswer]);
        }
      } 
      // First time answering this question
      else {
        console.log('First time answering this question');
        const newAnswer = { 
          ...verifiedAnswer, 
          attemptCount: 1 
        };
        setQuizAnswers([...quizAnswers, newAnswer]);
      }
    } 
    // Standard or timed mode - simpler logic
    else {
      console.log("=== Standard/Timed mode answer handling ===");
      
      // Check if we already have an answer for this question
      const existingIndex = quizAnswers.findIndex(a => a.questionId === answer.questionId);
      console.log(`Existing answer found: ${existingIndex !== -1 ? 'Yes' : 'No'}`);
      
      if (existingIndex !== -1) {
        // Replace the existing answer
        const updatedAnswers = [...quizAnswers];
        updatedAnswers[existingIndex] = verifiedAnswer;
        setQuizAnswers(updatedAnswers);
      } else {
        // Add the new answer
        setQuizAnswers([...quizAnswers, verifiedAnswer]);
      }
    }
    
    // Note: We've moved the scheduling of incorrect questions to the useEffect
    // This helps avoid race conditions between state updates
    console.log("Answer recorded - useEffect will handle scheduling incorrect questions");
  };

  const navigateToQuestion = (index: number) => {
    console.log("=== navigateToQuestion called ===");
    console.log(`Navigating from index ${currentQuestionIndex} to ${index}`);
    console.log(`Current questions length: ${quizQuestions.length}`);
    console.log(`Quiz mode: ${quizSettings.mode}`);
    
    // Set the navigating flag to avoid question changes during transitions
    setIsNavigating(true);
    console.log("Navigation lock engaged to prevent race conditions");
    
    // Pause the timer for the current question
    const timeSpent = pauseQuizTimer();
    console.log(`Time spent on current question: ${timeSpent}ms`);
    
    // If we have a current question and time spent, update the answer with timing data
    if (quizQuestions.length > 0 && currentQuestionIndex < quizQuestions.length && timeSpent > 0) {
      const currentQuestion = quizQuestions[currentQuestionIndex];
      console.log(`Current question ID: ${currentQuestion.id}`);
      
      const existingAnswerIndex = quizAnswers.findIndex(a => a.questionId === currentQuestion.id);
      console.log(`Existing answer found: ${existingAnswerIndex !== -1 ? 'Yes' : 'No'}`);
      
      // Only update if we already have an answer for this question
      if (existingAnswerIndex !== -1) {
        console.log("Updating timing data for existing answer");
        const updatedAnswers = [...quizAnswers];
        updatedAnswers[existingAnswerIndex] = {
          ...updatedAnswers[existingAnswerIndex],
          timeSpent
        };
        setQuizAnswers(updatedAnswers);
      }
    }
    
    // Check if it's a valid index
    if (index >= 0 && index <= quizQuestions.length) {
      console.log(`Valid index, updating currentQuestionIndex to ${index}`);
      
      // Directly update the index without complex transitions
      setCurrentQuestionIndex(index);
      
      // Reset timer for new question
      setQuestionTimerValue(quizSettings.timePerQuestion);
      questionStartTimeRef.current = null;
      
      // Auto-start timer if in timed mode
      if (quizSettings.mode === "timed" && index < quizQuestions.length) {
        console.log("Timed mode - starting timer for new question");
        questionStartTimeRef.current = Date.now();
        startQuizTimer();
      }
    } else {
      console.log(`Invalid index: ${index}. Current questions length: ${quizQuestions.length}`);
    }
    
    // Clear the navigating flag after a short delay
    setTimeout(() => {
      console.log("Navigation lock released");
      setIsNavigating(false);
    }, 200);
  };

  const checkAnswers = () => {
    if (!activeQuiz || quizQuestions.length === 0) return;

    // Pause timer
    pauseQuizTimer();

    // Calculate timing statistics
    const totalTimeSpent = quizStartTime 
      ? Date.now() - quizStartTime 
      : quizAnswers.reduce((total, answer) => total + (answer.timeSpent || 0), 0);
      
    const answeredQuestions = quizAnswers.filter(a => a.questionId !== undefined).length;
    const averageTimePerQuestion = answeredQuestions > 0 
      ? Math.round(totalTimeSpent / answeredQuestions) 
      : 0;

    // Count correct answers
    const correctAnswers = quizAnswers.filter(a => a.isCorrect).length;

    // Create results object
    const results: QuizResult = {
      quizId: activeQuiz.id,
      title: activeQuiz.title,
      totalQuestions: originalQuestionCount || quizQuestions.length,
      correctAnswers,
      answers: quizAnswers,
      date: new Date().toISOString(),
      quizMode: quizSettings.mode,
      totalTimeSpent,
      averageTimePerQuestion
    };

    setQuizResults(results);
  };

  const resetQuiz = () => {
    setQuizAnswers([]);
    setQuizResults(null);
    setCurrentQuestionIndex(0);
    resetQuizTimer();
    localStorage.removeItem('activeQuiz');
    localStorage.removeItem('quizResults');
    localStorage.removeItem('quizAnswers');
  };
  
  // Effect hook to check for practice mode completion
  useEffect(() => {
    try {
      // Skip if not in practice mode or missing quiz data
      if (quizSettings.mode !== "practice" || !activeQuiz || !activeQuiz.content.questions) {
        return;
      }
      
      // Check for completion only if we've answered at least some questions
      if (quizAnswers.length === 0) return;
      
      // Check if all original questions have been answered correctly
      if (originalQuestionCount && activeQuiz.content.questions) {
        // Get only the correct answers
        const correctAnswers = quizAnswers.filter(a => a.isCorrect);
        
        // Check if all original questions have been answered correctly at least once
        const allCorrect = activeQuiz.content.questions.every(q => 
          correctAnswers.some(a => a.questionId === q.id)
        );
        
        console.log(`Practice mode completion check: All questions correct? ${allCorrect}`);
        console.log(`Last question? ${currentQuestionIndex === quizQuestions.length - 1}`);
        
        // If all questions have been answered correctly, we should be ready to finish
        // as long as we're not waiting for a repeat of the current question
        if (allCorrect && !practiceQuizCompleted) {
          console.log("All original questions have been answered correctly at least once!");
          
          // If we're on the last question, determine if we can finish
          if (currentQuestionIndex === quizQuestions.length - 1) {
            // Find the current question
            const currentQuestion = quizQuestions[currentQuestionIndex];
            
            // If the current question has been answered correctly, we should finish
            if (correctAnswers.some(a => a.questionId === currentQuestion.id)) {
              console.log("PRACTICE MODE COMPLETED: All questions mastered!");
              setPracticeQuizCompleted(true);
              
              // Only navigate to results if the user manually triggers it
              // by clicking "End Practice"
            } else {
              console.log("Final question not answered correctly yet - must complete it first");
            }
          } else {
            // There are still repeated questions in the queue, 
            // so we should keep going even though all original questions 
            // have been answered correctly at least once
            console.log("Still working through repeated questions");
          }
        }
      }
    } catch (err) {
      console.error("Error checking for practice completion:", err);
    }
  }, [quizAnswers, activeQuiz, quizSettings.mode]);

  // Navigation helpers
  const navigateToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      navigateToQuestion(currentQuestionIndex - 1);
    }
  };

  const isLastQuestion = () => {
    return currentQuestionIndex === quizQuestions.length - 1;
  };

  const isFirstQuestion = () => {
    return currentQuestionIndex === 0;
  };

  // Practice mode helpers
  const shouldRepeatQuestion = (questionId: number) => {
    // In practice mode, we repeat questions that haven't been answered correctly yet
    if (quizSettings.mode !== "practice") return false;
    
    const answer = quizAnswers.find(a => a.questionId === questionId);
    return answer ? !answer.isCorrect : false;
  };

  const getQuestionAttempts = (questionId: number) => {
    // Find all answers for this question (there might be multiple in practice mode)
    const answers = quizAnswers.filter(a => a.questionId === questionId);
    
    if (answers.length === 0) return 0;
    
    // If we have any answers with an attemptCount, use the highest one
    const answersWithCount = answers.filter(a => a.attemptCount !== undefined);
    if (answersWithCount.length > 0) {
      // Get the highest attempt count
      return Math.max(...answersWithCount.map(a => a.attemptCount || 1));
    }
    
    // Otherwise just return the count of answers for this question
    return answers.length;
  };

  const getTotalIncorrectAttempts = () => {
    return quizAnswers.reduce((total, answer) => {
      // If never answered correctly, count all attempts
      if (!answer.isCorrect) {
        return total + (answer.attemptCount || 1);
      }
      // If eventually answered correctly, count attempts - 1
      if (answer.attemptCount && answer.attemptCount > 1) {
        return total + (answer.attemptCount - 1);
      }
      return total;
    }, 0);
  };

  // Get the actual number of questions to display in the UI
  // Use original count for practice mode to prevent UI glitches
  const getEffectiveQuestionCount = () => {
    return quizSettings.mode === "practice" && originalQuestionCount 
      ? originalQuestionCount 
      : quizQuestions.length;
  };

  const value = {
    activeQuiz,
    setActiveQuiz,
    quizResults,
    setQuizResults,
    quizAnswers,
    setQuizAnswers,
    addAnswer,
    checkAnswers,
    resetQuiz,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    navigateToQuestion,
    navigateToPreviousQuestion,
    quizSettings,
    setQuizSettings,
    quizQuestions,
    setQuizQuestions,
    totalQuestionCount: getEffectiveQuestionCount(),
    startQuizTimer,
    pauseQuizTimer,
    questionTimerValue,
    isTimerRunning,
    quizStartTime,
    resetQuizTimer,
    shouldRepeatQuestion,
    getQuestionAttempts,
    isLastQuestion,
    isFirstQuestion,
    getTotalIncorrectAttempts,
    practiceQuizCompleted // Make sure to include the practice completion flag
  };

  return (
    <ActiveQuizContext.Provider value={value}>
      {children}
    </ActiveQuizContext.Provider>
  );
};

export const useActiveQuiz = () => {
  const context = useContext(ActiveQuizContext);
  if (context === undefined) {
    throw new Error("useActiveQuiz must be used within an ActiveQuizProvider");
  }
  return context;
};