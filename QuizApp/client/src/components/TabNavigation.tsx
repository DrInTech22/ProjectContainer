import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

export default function TabNavigation() {
  const [location, setLocation] = useLocation();
  
  // Handle active tab highlighting
  const isActiveTab = (path: string) => {
    if (path === "/") {
      return location === "/" || location === "/create";
    }
    if (path === "/take") {
      return location === "/take" || location.startsWith("/take-quiz");
    }
    if (path === "/quiz-results") {
      return location === "/quiz-results";
    }
    return location.startsWith(path);
  };
  
  return (
    <div className="mb-8">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px" aria-label="Tabs">
          <button 
            onClick={() => setLocation("/")}
            className={cn(
              "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm",
              isActiveTab("/") 
                ? "text-primary border-primary dark:text-primary dark:border-primary" 
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 border-transparent"
            )}
          >
            Create Quiz
          </button>
          
          <button 
            onClick={() => setLocation("/take")}
            className={cn(
              "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ml-8",
              isActiveTab("/take")
                ? "text-primary border-primary dark:text-primary dark:border-primary" 
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 border-transparent"
            )}
          >
            Take Quiz
          </button>
          
          <button 
            onClick={() => setLocation("/quiz-results")}
            className={cn(
              "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ml-8",
              isActiveTab("/quiz-results")
                ? "text-primary border-primary dark:text-primary dark:border-primary" 
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 border-transparent"
            )}
          >
            Results
          </button>
        </nav>
      </div>
    </div>
  );
}
