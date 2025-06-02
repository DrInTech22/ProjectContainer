
import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuizzes } from "@/hooks/useQuizzes";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { countQuestionTypes } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { 
  PlayCircle, 
  Loader2, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Sparkles,
  BookOpen,
  Clock
} from "lucide-react";
import { useActiveQuiz } from "@/hooks/useActiveQuiz";
import { useToast } from "@/hooks/use-toast";
import { Quiz, QuizMode } from "@/lib/types";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

export default function TakeQuiz() {
  const [, navigate] = useLocation();
  const { quizzes, isLoading, deleteQuiz, updateQuiz } = useQuizzes();
  const activeQuizContext = useActiveQuiz();
  console.log("ActiveQuizContext:", activeQuizContext);
  const { setActiveQuiz, resetQuiz } = activeQuizContext;
  const { toast } = useToast();
  
  const [quizToDelete, setQuizToDelete] = useState<number | null>(null);
  const [editingQuizId, setEditingQuizId] = useState<number | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  
  const [quizModeDialogOpen, setQuizModeDialogOpen] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [selectedMode, setSelectedMode] = useState<"standard" | "practice" | "timed">("standard");
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);

  const startQuiz = (quizId: number) => {
    // Open the quiz mode selection dialog instead of immediately starting the quiz
    setSelectedQuizId(quizId);
    setQuizModeDialogOpen(true);
  };
  
  const handleStartQuiz = () => {
    // Apply the selected settings
    resetQuiz();
    const settings = {
      mode: selectedMode,
      timePerQuestion,
      questionCount,
      shuffleQuestions,
      immediateReview: selectedMode === "practice"
    };
    
    // Apply settings if available
    if (activeQuizContext.setQuizSettings) {
      activeQuizContext.setQuizSettings(settings);
    }
    
    // Navigate to the quiz
    if (selectedQuizId) {
      navigate(`/take-quiz/${selectedQuizId}`);
    }
    
    // Close the dialog
    setQuizModeDialogOpen(false);
  };
  
  const handleDeleteQuiz = (id: number) => {
    deleteQuiz.mutate(id, {
      onSuccess: () => {
        toast({
          title: "Quiz deleted",
          description: "The quiz has been successfully deleted.",
        });
        setQuizToDelete(null);
      },
      onError: () => {
        toast({
          title: "Failed to delete quiz",
          description: "There was an error deleting the quiz. Please try again.",
          variant: "destructive",
        });
      }
    });
  };
  
  const startEditingQuiz = (quiz: Quiz) => {
    setEditingQuizId(quiz.id);
    setEditedTitle(quiz.title);
  };
  
  const cancelEditingQuiz = () => {
    setEditingQuizId(null);
    setEditedTitle("");
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!quizzes || quizzes.length === 0) {
    return (
      <Card className="my-6">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <h2 className="text-xl font-medium mb-2">No Quizzes Available</h2>
            <p className="text-gray-500 mb-6">Create a quiz first to get started.</p>
            <Button onClick={() => navigate("/create")}>Create a Quiz</Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold mb-6">Available Quizzes</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quizzes.map((quiz) => {
          const questionCounts = countQuestionTypes(quiz.content.questions);
          
          return (
            <div key={quiz.id}>
              <Card className="overflow-hidden">
                <div className="bg-primary/10 p-4">
                  <h2 className="text-xl font-semibold">{quiz.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Created: {formatDate(quiz.created_at)}
                  </p>
                </div>
                
                <CardContent className="pt-4">
                  <div className="flex gap-2 mb-4">
                    <Badge variant="outline" className="bg-background">
                      {questionCounts.total} Questions
                    </Badge>
                    
                    {questionCounts.trueFalse > 0 && (
                      <Badge variant="outline" className="bg-background">
                        {questionCounts.trueFalse} True/False
                      </Badge>
                    )}
                    
                    {questionCounts.mcq > 0 && (
                      <Badge variant="outline" className="bg-background">
                        {questionCounts.mcq} Multiple Choice
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      onClick={() => startQuiz(quiz.id)}
                      className="w-full"
                    >
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Start Quiz
                    </Button>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => startEditingQuiz(quiz)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => setQuizToDelete(quiz.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <AlertDialog open={quizToDelete === quiz.id} onOpenChange={() => setQuizToDelete(null)}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this quiz? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Dialog open={editingQuizId === quiz.id} onOpenChange={() => cancelEditingQuiz()}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Quiz</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Quiz Title</Label>
                      <Input
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        placeholder="Enter quiz title"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={cancelEditingQuiz}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        updateQuiz.mutate(
                          { id: quiz.id, data: { title: editedTitle } },
                          {
                            onSuccess: () => {
                              cancelEditingQuiz();
                              toast({
                                title: "Quiz updated",
                                description: "The quiz title has been updated successfully.",
                              });
                            }
                          }
                        );
                      }}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          );
        })}
      </div>
      
      {/* Quiz Mode Selection Dialog */}
      <Dialog open={quizModeDialogOpen} onOpenChange={setQuizModeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Quiz Mode</DialogTitle>
            <DialogDescription>
              Choose how you want to take this quiz
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            <RadioGroup value={selectedMode} onValueChange={(value) => setSelectedMode(value as "standard" | "practice" | "timed")}>
              <div className="flex items-start space-x-3 p-3 rounded-md border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                <RadioGroupItem value="standard" id="mode-standard" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="mode-standard" className="flex items-center text-base font-medium cursor-pointer">
                    <Sparkles className="h-5 w-5 mr-2 text-primary" />
                    Standard Mode
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Take the quiz in standard format. Get results at the end.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 rounded-md border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                <RadioGroupItem value="practice" id="mode-practice" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="mode-practice" className="flex items-center text-base font-medium cursor-pointer">
                    <BookOpen className="h-5 w-5 mr-2 text-green-500" />
                    Practice Mode
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Get immediate feedback after each question. No time limits.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 rounded-md border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                <RadioGroupItem value="timed" id="mode-timed" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="mode-timed" className="flex items-center text-base font-medium cursor-pointer">
                    <Clock className="h-5 w-5 mr-2 text-blue-500" />
                    Timed Mode
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Answer questions with a time limit. Auto-advance when time expires.
                  </p>
                </div>
              </div>
            </RadioGroup>
            
            <div className="space-y-4 pt-2">
              {selectedMode === "timed" && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Time per question</Label>
                    <span className="text-sm font-medium">{timePerQuestion} seconds</span>
                  </div>
                  <Slider 
                    value={[timePerQuestion]} 
                    min={10} 
                    max={120} 
                    step={5}
                    onValueChange={(value) => setTimePerQuestion(value[0])} 
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Question count</Label>
                  <Input 
                    type="number" 
                    value={questionCount || ''} 
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setQuestionCount(isNaN(val) ? null : val);
                    }}
                    className="w-20 h-8" 
                    placeholder="All"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Leave empty to use all questions
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="shuffle-questions">Shuffle questions</Label>
                <Switch 
                  id="shuffle-questions" 
                  checked={shuffleQuestions} 
                  onCheckedChange={setShuffleQuestions} 
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuizModeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStartQuiz}>
              Start Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
