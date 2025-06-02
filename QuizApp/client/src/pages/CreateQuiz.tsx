import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { parseQuizText } from "@/lib/quizParser";
import { convertTextToJson } from "@/lib/textToJsonConverter";
import { getInflammationQuiz } from "@/lib/inflammationQuizData";
import { useQuizzes } from "@/hooks/useQuizzes";
import { QuizContent, TrueFalseQuestion, MCQQuestion } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Wand2, Save, X, HelpCircle, Check, FileJson, FileText, ArrowRight, Download } from "lucide-react";
import QuestionDisplay from "@/components/QuestionDisplay";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CreateQuiz() {
  const [title, setTitle] = useState("");
  const [quizContent, setQuizContent] = useState("");
  const [quizJsonContent, setQuizJsonContent] = useState("");
  const [inputTab, setInputTab] = useState<string>("text");
  const [parsedQuiz, setParsedQuiz] = useState<QuizContent | null>(null);
  const [showTextHelp, setShowTextHelp] = useState(false);
  const [showJsonHelp, setShowJsonHelp] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [, navigate] = useLocation();
  const { createQuiz } = useQuizzes();
  const { toast } = useToast();
  
  const handleParseQuiz = async () => {
    if (inputTab === "text") {
      if (!quizContent.trim()) {
        toast({
          title: "Error",
          description: "Please enter some quiz content to parse",
          variant: "destructive",
        });
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Generate JSON from text format
        const jsonString = convertTextToJson(quizContent, title);
        // Parse the JSON to get the quiz content
        const jsonData = JSON.parse(jsonString);
        
        // Use the client-side parser directly instead of the API
        setParsedQuiz(jsonData);
        setIsLoading(false);
        
        toast({
          title: "Success",
          description: `Parsed ${jsonData.questions.length} questions successfully`,
        });
      } catch (error) {
        setIsLoading(false);
        toast({
          title: "Error parsing quiz",
          description: error instanceof Error ? error.message : "Failed to parse quiz content. Try the JSON format option.",
          variant: "destructive",
        });
      }
    } else {
      // JSON Parsing
      if (!quizJsonContent.trim()) {
        toast({
          title: "Error",
          description: "Please enter JSON content for the quiz",
          variant: "destructive",
        });
        return;
      }
      
      try {
        setIsLoading(true);
        const jsonData = JSON.parse(quizJsonContent);
        
        // Validate the JSON structure
        if (!jsonData.topic || !Array.isArray(jsonData.questions)) {
          throw new Error("Invalid JSON format: must have 'topic' and 'questions' array");
        }
        
        // Validate questions
        const validatedQuestions = jsonData.questions.map((q: any, index: number) => {
          if (!q.type || !q.question) {
            throw new Error(`Question ${index + 1} is missing required fields`);
          }
          
          if (q.type === "true_false") {
            if (q.correct_answer !== "True" && q.correct_answer !== "False") {
              throw new Error(`Question ${index + 1}: True/False questions must have 'True' or 'False' as correct_answer`);
            }
            return {
              id: q.id || index + 1,
              type: "true_false",
              question: q.question,
              correct_answer: q.correct_answer
            } as TrueFalseQuestion;
          } else if (q.type === "mcq") {
            if (!q.options || Object.keys(q.options).length === 0) {
              throw new Error(`Question ${index + 1}: MCQ must have options`);
            }
            if (!q.correct_answer || !q.options[q.correct_answer]) {
              throw new Error(`Question ${index + 1}: Invalid correct_answer for MCQ`);
            }
            return {
              id: q.id || index + 1,
              type: "mcq",
              question: q.question,
              options: q.options,
              correct_answer: q.correct_answer
            } as MCQQuestion;
          } else {
            throw new Error(`Question ${index + 1}: Unknown question type '${q.type}'`);
          }
        });
        
        const parsed: QuizContent = {
          topic: jsonData.topic,
          questions: validatedQuestions
        };
        
        setParsedQuiz(parsed);
        setIsLoading(false);
        
        toast({
          title: "Success",
          description: `Parsed ${validatedQuestions.length} questions successfully`,
        });
      } catch (error) {
        setIsLoading(false);
        toast({
          title: "Error parsing JSON",
          description: error instanceof Error ? error.message : "Failed to parse JSON content",
          variant: "destructive",
        });
      }
    }
  };
  
  const handleSaveQuiz = () => {
    if (!parsedQuiz) return;
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for your quiz",
        variant: "destructive",
      });
      return;
    }
    
    // Create a copy of the quiz with the updated title
    const quizToSave = {
      title: title.trim(),
      topic: parsedQuiz.topic,
      content: {
        ...parsedQuiz,
        topic: title.trim() // Update the topic to match the title
      }
    };
    
    createQuiz.mutate(quizToSave, {
      onSuccess: (savedQuiz) => {
        setShowSuccess(true);
        toast({
          title: "Success",
          description: `Quiz "${title}" saved successfully!`,
        });
        
        // Ask the user if they want to take the quiz now
        const takeQuizNow = window.confirm(`Quiz "${title}" has been saved successfully! Would you like to take it now?`);
        
        if (takeQuizNow) {
          navigate(`/take`);
        }
        
        setTimeout(() => setShowSuccess(false), 3000);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to save quiz. Please try again.",
          variant: "destructive",
        });
      }
    });
  };
  
  const handleClear = () => {
    setTitle("");
    setQuizContent("");
    setQuizJsonContent("");
    setParsedQuiz(null);
  };

  const jsonExample = `{
  "topic": "Inflammation Biology",
  "questions": [
    {
      "id": 1,
      "type": "true_false",
      "question": "Inflammation is a response of vascularized tissues.",
      "correct_answer": "True"
    },
    {
      "id": 2,
      "type": "true_false",
      "question": "The primary role of inflammation is to promote the spread of infection.",
      "correct_answer": "False"
    },
    {
      "id": 3,
      "type": "mcq",
      "question": "Inflammation is best defined as:",
      "options": {
        "a": "Option 1",
        "b": "Option 2",
        "c": "Correct option text",
        "d": "Option 4"
      },
      "correct_answer": "c"
    }
  ]
}`;
  
  return (
    <section>
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold mb-4">Create New Quiz</h2>
          
          <div className="mb-4">
            <label htmlFor="quiz-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quiz Title
            </label>
            <Input
              id="quiz-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Inflammation Biology"
              className="w-full"
            />
          </div>
          
          <Tabs defaultValue="text" value={inputTab} onValueChange={setInputTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="text">
                <FileText className="h-4 w-4 mr-2" />
                Text Format
              </TabsTrigger>
              <TabsTrigger value="json">
                <FileJson className="h-4 w-4 mr-2" />
                JSON Format
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="text">
              <div className="mb-4">
                <label htmlFor="quiz-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quiz Content (Text Format)
                </label>
                <div className="relative">
                  <Textarea
                    id="quiz-content"
                    value={quizContent}
                    onChange={(e) => setQuizContent(e.target.value)}
                    rows={12}
                    placeholder={`True/False:
1. Inflammation is a response of vascularized tissues.
2. The primary role of inflammation is to promote the spread of infection (False).

Multiple Choice Questions:
3. Inflammation is best defined as: a) Option 1 b) Option 2 c) Correct option text d) Option 4

Answers:
1. True
2. False
3. c`}
                    className="font-mono text-sm"
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400">
                    Format instructions
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-1 text-gray-500"
                      onClick={() => setShowTextHelp(!showTextHelp)}
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {showTextHelp && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-md text-sm">
                  <h3 className="font-medium mb-2">Text Format Instructions:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Divide your quiz into "True/False:" and "Multiple Choice Questions:" sections</li>
                    <li>Number each question sequentially</li>
                    <li>For MCQs, provide options as a), b), c), d), etc.</li>
                    <li>Optionally provide answers inline in parentheses or in a separate "Answers:" section</li>
                  </ul>
                  <div className="mt-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        if (!quizContent.trim()) {
                          toast({
                            title: "Error",
                            description: "Please enter text content to convert",
                            variant: "destructive",
                          });
                          return;
                        }
                        try {
                          const jsonContent = convertTextToJson(quizContent, title);
                          setQuizJsonContent(jsonContent);
                          setInputTab("json");
                          toast({
                            title: "Success",
                            description: "Text converted to JSON format",
                          });
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to convert text to JSON format",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="text-xs"
                    >
                      <FileJson className="h-3 w-3 mr-1" />
                      Convert to JSON Format
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="json">
              <div className="mb-4">
                <label htmlFor="quiz-json" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quiz Content (JSON Format)
                </label>
                <div className="relative">
                  <Textarea
                    id="quiz-json"
                    value={quizJsonContent}
                    onChange={(e) => setQuizJsonContent(e.target.value)}
                    rows={12}
                    placeholder={jsonExample}
                    className="font-mono text-sm"
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400">
                    JSON format help
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-1 text-gray-500"
                      onClick={() => setShowJsonHelp(!showJsonHelp)}
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {showJsonHelp && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-md text-sm">
                  <h3 className="font-medium mb-2">JSON Format Structure:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Use a valid JSON structure with "topic" and "questions" array</li>
                    <li>Each question must have "type" ("true_false" or "mcq"), "question", and "correct_answer"</li>
                    <li>MCQ questions must also have "options" object with letter keys (a, b, c, etc.)</li>
                    <li>The "correct_answer" for MCQs must match one of the option keys</li>
                  </ul>
                  <div className="mt-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setQuizJsonContent(jsonExample)}
                      className="text-xs"
                    >
                      Insert Example
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={handleParseQuiz}
              disabled={isLoading}
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Parse Quiz
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClear}
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
            <Button 
              variant="secondary"
              onClick={() => {
                // Load the Inflammation quiz directly
                const inflammationQuiz = getInflammationQuiz();
                setParsedQuiz(inflammationQuiz);
                setTitle("Inflammation Biology Quiz");
                
                toast({
                  title: "Success",
                  description: `Loaded Inflammation quiz with ${inflammationQuiz.questions.length} questions`,
                });
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Load Sample Inflammation Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {parsedQuiz && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Quiz Preview</h2>
              <div className="flex gap-3">
                <Button onClick={() => navigate("/take")} variant="outline">
                  View All Quizzes
                </Button>
                <Button onClick={handleSaveQuiz} variant="success">
                  <Save className="w-4 h-4 mr-2" />
                  Save Quiz
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              {parsedQuiz.questions.map((question, index) => (
                <QuestionDisplay 
                  key={question.id}
                  question={question}
                  index={index}
                />
              ))}
            </div>
            
            <div className="mt-6 flex justify-center">
              <Button 
                onClick={handleSaveQuiz} 
                size="lg" 
                className="w-full max-w-md"
                variant="default"
              >
                <Save className="w-5 h-5 mr-2" />
                Save Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {showSuccess && (
        <Alert className="bg-success bg-opacity-10 dark:bg-opacity-20 text-success">
          <Check className="h-4 w-4 mr-2" />
          <AlertDescription>Quiz successfully saved!</AlertDescription>
        </Alert>
      )}
    </section>
  );
}
