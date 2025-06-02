import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Header from "@/components/Header";
import TabNavigation from "@/components/TabNavigation";
import CreateQuiz from "@/pages/CreateQuiz";
import TakeQuiz from "@/pages/TakeQuiz";
import QuizResults from "@/pages/QuizResults";
import ActiveQuiz from "@/pages/ActiveQuiz";
import { ActiveQuizProvider } from "./hooks/useActiveQuiz";

function Router() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <TabNavigation />
        <Switch>
          <Route path="/" component={CreateQuiz} />
          <Route path="/create" component={CreateQuiz} />
          <Route path="/take" component={TakeQuiz} />
          <Route path="/take-quiz/:id" component={ActiveQuiz} />
          <Route path="/quiz-results" component={QuizResults} />
          <Route path="/results" component={QuizResults} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ActiveQuizProvider>
          <Toaster />
          <Router />
        </ActiveQuizProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
