import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useActiveQuiz } from "@/hooks/useActiveQuiz";
import { calculatePercentage } from "@/lib/utils";
import QuestionDisplay from "@/components/QuestionDisplay";
import { ChevronLeft, Trophy, BarChart2, Home, Clock, Check, X, Filter } from "lucide-react";

export default function QuizResults() {
  const [, navigate] = useLocation();
  const { quizResults, activeQuiz, quizAnswers, resetQuiz, quizSettings } = useActiveQuiz();
  const [filterType, setFilterType] = useState<'all' | 'correct' | 'incorrect'>('all');

  useEffect(() => {
    if (!quizResults || !activeQuiz) {
      navigate("/");
    }
  }, [quizResults, activeQuiz, navigate]);

  if (!quizResults || !activeQuiz || !quizAnswers) {
    return null;
  }

  // For practice mode, we need to handle unique questions differently
  const isPracticeMode = quizResults.quizMode === "practice";
  
  // First, gather all unique question IDs that were attempted
  const uniqueQuestionIds = new Set<number>();
  quizAnswers.forEach(answer => uniqueQuestionIds.add(answer.questionId));
  
  // Now count correct/incorrect answers, but for practice mode only count each question once (the final state)
  const questionResults = new Map<number, boolean>();
  
  // Process answers in order, so the last answer for each question will be the final state
  for (const answer of quizAnswers) {
    questionResults.set(answer.questionId, answer.isCorrect === true);
  }
  
  // Count correct answers (using final state for each question)
  const correctAnswers = Array.from(questionResults.values()).filter(isCorrect => isCorrect).length;
  
  // Count incorrect answers (if there's no final correct answer)
  const incorrectAnswers = uniqueQuestionIds.size - correctAnswers;
  
  // For all modes, we should only count questions that were actually answered
  // This ensures we're only showing stats for questions the user attempted
  const totalQuestions = uniqueQuestionIds.size;
    
  const percentageScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const isPassing = percentageScore >= 60;
  
  // Calculate time statistics
  const totalTimeSpent = quizResults.totalTimeSpent || 0;
  const avgTimePerQuestion = quizResults.averageTimePerQuestion || 0;
  
  // Format time for display
  const formatTime = (ms: number): string => {
    if (ms === 0) return "N/A";
    
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };
  
  // Filter questions based on user selection
  // First, only include questions that were actually answered
  const answeredQuestions = activeQuiz.content.questions.filter(question => 
    quizAnswers.some(a => a.questionId === question.id)
  );
  
  // Then apply user's filter selection
  const filteredQuestions = answeredQuestions.filter((question) => {
    const answer = quizAnswers.find(a => a.questionId === question.id);
    
    if (filterType === 'all') return true;
    if (filterType === 'correct') return answer?.isCorrect === true;
    if (filterType === 'incorrect') return answer?.isCorrect === false;
    
    return true;
  });

  return (
    <div className="py-8">
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">{activeQuiz.title} - Results</h1>
            <div className="flex justify-center items-center">
              <Trophy className={`h-6 w-6 mr-2 ${isPassing ? 'text-yellow-500' : 'text-gray-400'}`} />
              <p className="text-xl font-semibold">
                {isPassing ? "Passed!" : "Try Again"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
              <p className="text-gray-500 text-sm mb-1">Score</p>
              <p className="text-3xl font-bold">{percentageScore}%</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
              <p className="text-gray-500 text-sm mb-1">Correct Answers</p>
              <p className="text-3xl font-bold">{correctAnswers} / {totalQuestions}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
              <p className="text-gray-500 text-sm mb-1">Date</p>
              <p className="text-lg font-medium">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => {
                resetQuiz();
                navigate(`/take-quiz/${activeQuiz.id}`);
              }}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button
              onClick={() => navigate("/")}
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Time statistics */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Time Statistics
          </CardTitle>
          <CardDescription>
            {quizSettings.mode === "timed" ? "Performance metrics for timed quiz" : "Time spent on each question"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Total Time</div>
              <div className="text-2xl font-semibold">{formatTime(totalTimeSpent)}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Average Time per Question</div>
              <div className="text-2xl font-semibold">{formatTime(avgTimePerQuestion)}</div>
            </div>
          </div>
          
          {/* Question time distribution removed as requested */}
        </CardContent>
      </Card>
      
      {/* Question review */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <BarChart2 className="h-5 w-5 mr-2" />
              Question Review
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-500 mr-1">Filter:</div>
              <div className="flex rounded-md overflow-hidden">
                <Toggle 
                  pressed={filterType === 'all'} 
                  onPressedChange={() => setFilterType('all')}
                  className="rounded-none"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  All
                </Toggle>
                <Toggle 
                  pressed={filterType === 'correct'} 
                  onPressedChange={() => setFilterType('correct')}
                  className="rounded-none"
                >
                  <Check className="h-4 w-4 mr-1 text-green-500" />
                  Correct
                </Toggle>
                <Toggle 
                  pressed={filterType === 'incorrect'} 
                  onPressedChange={() => setFilterType('incorrect')}
                  className="rounded-none"
                >
                  <X className="h-4 w-4 mr-1 text-red-500" />
                  Incorrect
                </Toggle>
              </div>
            </div>
          </div>
          
          <CardDescription>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">
                {filteredQuestions.length} Questions
              </Badge>
              
              {filterType === 'all' && (
                <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">
                  {correctAnswers} Correct / {incorrectAnswers} Incorrect
                </Badge>
              )}
              
              {filterType === 'correct' && (
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  {correctAnswers} Correct Answers
                </Badge>
              )}
              
              {filterType === 'incorrect' && (
                <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                  {incorrectAnswers} Incorrect Answers
                </Badge>
              )}
            </div>
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-8">
            {filteredQuestions.map((question, index) => {
              const answer = quizAnswers.find(a => a.questionId === question.id);
              return (
                <QuestionDisplay
                  key={question.id}
                  question={question}
                  index={activeQuiz.content.questions.findIndex(q => q.id === question.id)}
                  showResults={true}
                  answer={answer}
                />
              );
            })}
            
            {filteredQuestions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No questions match the selected filter.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}