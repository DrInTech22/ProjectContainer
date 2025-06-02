import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertQuizSchema, 
  quizContentSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for quiz management

  // Create a new quiz
  app.post("/api/quizzes", async (req, res) => {
    try {
      console.log("Quiz creation request:", JSON.stringify(req.body));
      
      const quizData = insertQuizSchema.parse(req.body);
      console.log("Quiz data after parsing:", JSON.stringify(quizData));
      
      // Validate the content structure
      quizContentSchema.parse(quizData.content);
      console.log("Content validation passed");
      
      const quiz = await storage.createQuiz(quizData);
      console.log("Quiz created:", JSON.stringify(quiz));
      
      res.status(201).json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      
      if (error instanceof z.ZodError) {
        console.error("Zod validation error:", JSON.stringify(error.errors));
        res.status(400).json({ 
          message: "Invalid quiz data", 
          errors: error.errors 
        });
      } else {
        console.error("Server error:", error instanceof Error ? error.message : String(error));
        res.status(500).json({ message: "Failed to create quiz", error: error instanceof Error ? error.message : String(error) });
      }
    }
  });

  // Get all quizzes
  app.get("/api/quizzes", async (req, res) => {
    try {
      const quizzes = await storage.getAllQuizzes();
      res.json(quizzes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  // Get a specific quiz by ID
  app.get("/api/quizzes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid quiz ID" });
      }

      const quiz = await storage.getQuiz(id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      res.json(quiz);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  // Update a quiz
  app.put("/api/quizzes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid quiz ID" });
      }

      const quizData = insertQuizSchema.partial().parse(req.body);
      
      // If content is provided, validate it
      if (quizData.content) {
        quizContentSchema.parse(quizData.content);
      }
      
      const updatedQuiz = await storage.updateQuiz(id, quizData);
      if (!updatedQuiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      res.json(updatedQuiz);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid quiz data", 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ message: "Failed to update quiz" });
      }
    }
  });

  // Delete a quiz
  app.delete("/api/quizzes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid quiz ID" });
      }

      const success = await storage.deleteQuiz(id);
      if (!success) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete quiz" });
    }
  });

  // Parse quiz text endpoint
  app.post("/api/parse-quiz", async (req, res) => {
    try {
      const { text, title } = req.body;
      
      if (!text || typeof text !== "string") {
        return res.status(400).json({ message: "Quiz text is required" });
      }
      
      // Topic extraction, either from title or from first line of text
      let topic = title || "";
      if (!topic) {
        const firstLine = text.split('\n')[0];
        if (firstLine.includes("questions")) {
          topic = firstLine.match(/on (.*?):/)?.[1] || "Untitled Quiz";
        } else {
          topic = "Untitled Quiz";
        }
      }
      
      // Parse quiz text 
      const questions: any[] = [];
      
      // Split the text into sections
      const sections = text.split(/\n(?=True\/False:|Multiple Choice Questions:|Answer Key:|Answers:)/i);
      
      let trueFalseSection = "";
      let mcqSection = "";
      let answersSection = "";
      
      sections.forEach(section => {
        const trimmedSection = section.trim();
        if (/^True\/False:/i.test(trimmedSection)) {
          trueFalseSection = trimmedSection;
        } else if (/^Multiple Choice Questions:/i.test(trimmedSection)) {
          mcqSection = trimmedSection;
        } else if (/^Answer Key:/i.test(trimmedSection) || /^Answers:/i.test(trimmedSection)) {
          answersSection = trimmedSection;
        }
      });
      
      console.log("Found sections:", {
        tf: trueFalseSection ? "yes" : "no",
        mcq: mcqSection ? "yes" : "no",
        ans: answersSection ? "yes" : "no"
      });
      
      // Parse answers section first to reference later
      const answerMap = new Map<number, string>();
      if (answersSection) {
        console.log("Processing answer section");
        const answerLines = answersSection
          .replace(/^Answer Key:|^Answers:/i, "")
          .trim()
          .split("\n");
        
        // Try to detect if there are subsections for T/F and MCQ
        let processingTrueFalse = false;
        let processingMCQ = false;
        
        answerLines.forEach(line => {
          // Check if this is a section header
          if (/^True\/False:$/i.test(line.trim())) {
            processingTrueFalse = true;
            processingMCQ = false;
            return;
          } else if (/^Multiple Choice Questions:$/i.test(line.trim())) {
            processingTrueFalse = false;
            processingMCQ = true;
            return;
          }
          
          // Skip empty lines
          if (!line.trim()) return;
          
          // Different matching based on section
          let match;
          if (processingTrueFalse) {
            match = line.match(/^(\d+)\.\s*(True|False|T|F)$/i);
            if (match) {
              const questionNumber = parseInt(match[1]);
              let answer = match[2].trim();
              // Normalize T/F to True/False
              if (answer.toLowerCase() === 't') answer = 'True';
              if (answer.toLowerCase() === 'f') answer = 'False';
              answerMap.set(questionNumber, answer);
              console.log(`Added T/F answer for question ${questionNumber}: ${answer}`);
            }
          } else if (processingMCQ) {
            match = line.match(/^(\d+)\.\s*([a-zA-Z])(?:\))?$/i);
            if (match) {
              const questionNumber = parseInt(match[1]);
              const answer = match[2].trim().toLowerCase();
              answerMap.set(questionNumber, answer);
              console.log(`Added MCQ answer for question ${questionNumber}: ${answer}`);
            }
          } else {
            // If not in a specific section, try to identify answer type
            const tfMatch = line.match(/^(\d+)\.\s*(True|False|T|F)$/i);
            if (tfMatch) {
              const questionNumber = parseInt(tfMatch[1]);
              let answer = tfMatch[2].trim();
              // Normalize T/F to True/False
              if (answer.toLowerCase() === 't') answer = 'True';
              if (answer.toLowerCase() === 'f') answer = 'False';
              answerMap.set(questionNumber, answer);
              console.log(`Added generic T/F answer for question ${questionNumber}: ${answer}`);
              return;
            }
            
            const mcqMatch = line.match(/^(\d+)\.\s*([a-zA-Z])(?:\))?$/i);
            if (mcqMatch) {
              const questionNumber = parseInt(mcqMatch[1]);
              const answer = mcqMatch[2].trim().toLowerCase();
              answerMap.set(questionNumber, answer);
              console.log(`Added generic MCQ answer for question ${questionNumber}: ${answer}`);
              return;
            }
            
            // Generic answer line
            const genericMatch = line.match(/^(\d+)\.\s*(.+)$/);
            if (genericMatch) {
              const questionNumber = parseInt(genericMatch[1]);
              const answer = genericMatch[2].trim();
              answerMap.set(questionNumber, answer);
              console.log(`Added generic answer for question ${questionNumber}: ${answer}`);
            }
          }
        });
      }
      
      console.log("Answer map size:", answerMap.size);
      
      // Parse True/False questions
      if (trueFalseSection) {
        const tfLines = trueFalseSection.replace(/^True\/False:/i, "").trim().split("\n");
        
        tfLines.forEach(line => {
          // Skip empty lines
          if (!line.trim()) return;
          
          // More flexible matching for true/false questions
          const match = line.match(/^(\d+)\.(.+?)(?:\(([Tt]rue|[Ff]alse)\))?\.?$/i);
          if (match) {
            const id = parseInt(match[1]);
            let question = match[2].trim();
            
            // Check for inline answer
            let correct_answer = match[3];
            if (correct_answer) {
              // Normalize answer format
              correct_answer = correct_answer.toLowerCase() === 'true' || correct_answer.toLowerCase() === 't' 
                ? 'True' 
                : 'False';
            }
            
            // If no inline answer, check the answers section
            if (!correct_answer && answerMap.has(id)) {
              correct_answer = answerMap.get(id) || '';
              // Make sure it's properly formatted
              if (correct_answer.toLowerCase() === 'true' || correct_answer.toLowerCase() === 't') {
                correct_answer = 'True';
              } else if (correct_answer.toLowerCase() === 'false' || correct_answer.toLowerCase() === 'f') {
                correct_answer = 'False';
              }
            }
            
            console.log(`TF Question ${id}: ${question.substring(0, 30)}... Answer: ${correct_answer}`);
            
            // Only add if we have a valid answer
            if (correct_answer === 'True' || correct_answer === 'False') {
              questions.push({
                id,
                type: "true_false",
                question,
                correct_answer
              });
            }
          }
        });
      }
      
      // Parse Multiple Choice Questions
      if (mcqSection) {
        const mcqLines = mcqSection.replace(/^Multiple Choice Questions:/i, "").trim().split("\n");
        
        let currentQuestion: any = null;
        let questionBuffer = "";
        
        mcqLines.forEach(line => {
          // Skip empty lines
          if (!line.trim()) return;
          
          // Check if this is a new question - looser matching to better handle the format
          const questionMatch = line.match(/^(\d+)\.(.+)/);
          
          if (questionMatch) {
            // Save previous question if it exists
            if (currentQuestion && Object.keys(currentQuestion.options).length > 0) {
              console.log(`MCQ ${currentQuestion.id}: ${currentQuestion.question.substring(0, 30)}... Options: ${Object.keys(currentQuestion.options).join(',')} Answer: ${currentQuestion.correct_answer}`);
              questions.push(currentQuestion);
            }
            
            const id = parseInt(questionMatch[1]);
            questionBuffer = questionMatch[2].trim();
            
            // Extract options if they're in the question text (e.g., "Which is: a) Option1 b) Option2 c) Option3")
            const optionsInQuestion = questionBuffer.match(/(.+?)\s+a\)\s+(.*?)\s+b\)\s+(.*?)\s+c\)\s+(.*?)\s+(?:d\))?\s*(.*?)$/i);
            
            currentQuestion = {
              id,
              type: "mcq",
              question: optionsInQuestion ? optionsInQuestion[1].trim() : questionBuffer,
              options: {},
              correct_answer: ""
            };
            
            // If we parsed options from the question text
            if (optionsInQuestion) {
              // Add options a, b, c
              currentQuestion.options.a = optionsInQuestion[2].trim();
              currentQuestion.options.b = optionsInQuestion[3].trim();
              currentQuestion.options.c = optionsInQuestion[4].trim();
              
              // Add option d if it exists
              if (optionsInQuestion[5]) {
                currentQuestion.options.d = optionsInQuestion[5].trim();
              }
            }
            
            // Check answer from the answers section
            if (answerMap.has(id)) {
              currentQuestion.correct_answer = answerMap.get(id) || "";
            }
          } 
          // Continue collecting question text if not options yet and line doesn't look like an option
          else if (currentQuestion && !line.match(/^\s*[a-z]\)/i) && !Object.keys(currentQuestion.options).length) {
            questionBuffer += " " + line.trim();
            currentQuestion.question = questionBuffer;
          }
          // Check if this is an option for the current question
          else if (currentQuestion) {
            const optionMatch = line.match(/^\s*([a-z])\)\s+(.+)/i);
            if (optionMatch) {
              const optionLetter = optionMatch[1].toLowerCase();
              const optionText = optionMatch[2].trim();
              
              currentQuestion.options[optionLetter] = optionText;
            }
          }
        });
        
        // Add the last question if it exists
        if (currentQuestion && Object.keys(currentQuestion.options).length > 0) {
          console.log(`MCQ ${currentQuestion.id}: ${currentQuestion.question.substring(0, 30)}... Options: ${Object.keys(currentQuestion.options).join(',')} Answer: ${currentQuestion.correct_answer}`);
          questions.push(currentQuestion);
        }
      }
      
      // Create the structured quiz content
      const quizContent = {
        topic,
        questions
      };
      
      console.log(`Parsed ${questions.length} questions (${questions.filter(q => q.type === 'true_false').length} T/F, ${questions.filter(q => q.type === 'mcq').length} MCQ)`);
      
      res.json(quizContent);
    } catch (error) {
      console.error("Quiz parsing error:", error);
      res.status(500).json({ message: "Failed to parse quiz text" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
