import { Vote, MoonStar, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [, setLocation] = useLocation();
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 
          className="text-2xl font-bold text-primary dark:text-primary flex items-center cursor-pointer" 
          onClick={() => setLocation("/")}
        >
          <Vote className="w-6 h-6 mr-2" />
          Vote Generator
        </h1>
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <MoonStar className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
