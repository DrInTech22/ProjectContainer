import { useQuery, useMutation } from "@tanstack/react-query";
import { Quiz, QuizContent } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useQuizzes() {
  const { toast } = useToast();
  
  // Fetch all quizzes
  const {
    data: quizzes = [],
    isLoading,
    error,
    refetch
  } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
  });
  
  // Create a new quiz
  const createQuiz = useMutation({
    mutationFn: async (quizData: { title: string; topic: string; content: QuizContent }) => {
      const response = await apiRequest("POST", "/api/quizzes", quizData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      toast({
        title: "Quiz created",
        description: "Your quiz has been successfully saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create quiz",
        description: error.message || "An error occurred while saving your quiz.",
        variant: "destructive",
      });
    }
  });
  
  // Delete a quiz
  const deleteQuiz = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/quizzes/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      toast({
        title: "Quiz deleted",
        description: "The quiz has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete quiz",
        description: error.message || "An error occurred while deleting the quiz.",
        variant: "destructive",
      });
    }
  });
  
  // Get a specific quiz
  const getQuiz = async (id: number): Promise<Quiz | undefined> => {
    try {
      const response = await fetch(`/api/quizzes/${id}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch quiz");
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching quiz:", error);
      return undefined;
    }
  };
  
  // Update a quiz
  const updateQuiz = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<{ title: string, topic: string }> }) => {
      const response = await apiRequest("PATCH", `/api/quizzes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      toast({
        title: "Quiz updated",
        description: "The quiz has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update quiz",
        description: error.message || "An error occurred while updating the quiz.",
        variant: "destructive",
      });
    }
  });

  return {
    quizzes,
    isLoading,
    error,
    refetch,
    createQuiz,
    deleteQuiz,
    updateQuiz,
    getQuiz
  };
}
