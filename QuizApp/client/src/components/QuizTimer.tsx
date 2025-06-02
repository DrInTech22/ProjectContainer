import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Clock } from "lucide-react";

interface QuizTimerProps {
  timeRemaining: number; // in seconds
  totalTime: number; // in seconds
  isRunning: boolean;
  onTimeUp?: () => void;
}

export default function QuizTimer({ 
  timeRemaining, 
  totalTime,
  isRunning,
  onTimeUp 
}: QuizTimerProps) {
  const [timeLeft, setTimeLeft] = useState(timeRemaining);
  
  // Start the timer
  useEffect(() => {
    if (!isRunning) return;
    
    if (timeLeft <= 0) {
      if (onTimeUp) onTimeUp();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          if (onTimeUp) onTimeUp();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, onTimeUp]);
  
  // When timeRemaining prop changes, update the local state
  useEffect(() => {
    setTimeLeft(timeRemaining);
  }, [timeRemaining]);
  
  // Format the time as mm:ss
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  // Calculate the percentage of time left
  const percentageLeft = Math.round((timeLeft / totalTime) * 100);
  
  // Determine the color based on the time left
  const getProgressColor = () => {
    if (percentageLeft > 50) return "bg-green-500";
    if (percentageLeft > 25) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center text-sm font-medium">
          <Clock className="h-4 w-4 mr-1.5" />
          Time Remaining
        </div>
        <div className="text-sm font-semibold">
          {formatTime(timeLeft)}
        </div>
      </div>
      
      <Progress
        value={percentageLeft}
        className={`h-2 ${getProgressColor().replace('bg-', '')}`}
      />
    </div>
  );
}