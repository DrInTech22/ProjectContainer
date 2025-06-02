/**
 * Utility to convert text-based quiz format to JSON format
 */

interface QuizJsonStructure {
  topic: string;
  questions: Array<{
    id: number;
    type: "true_false" | "mcq";
    question: string;
    options?: Record<string, string>;
    correct_answer: string;
  }>;
}

/**
 * Converts a text-based quiz to a JSON structure
 * 
 * @param textContent Text content of the quiz in the specified format
 * @param title Optional title that will be used as topic if provided
 * @returns JSON representation of the quiz
 */
export function convertTextToJson(textContent: string, title: string = ""): string {
  try {
    // Initialize result
    const result: QuizJsonStructure = {
      topic: title || "Untitled Quiz",
      questions: []
    };

    // Extract topic from the first line if it contains "questions" and "on"
    if (!title) {
      const firstLine = textContent.split('\n')[0];
      if (firstLine.includes("questions") && firstLine.includes("on")) {
        const topicMatch = firstLine.match(/on\s+(.*?):/i);
        if (topicMatch && topicMatch[1]) {
          result.topic = topicMatch[1];
        }
      }
    }

    // Split the text into sections
    const sections = textContent.split(/\n(?=True\/False:|Multiple Choice Questions:|Answer Key:|Answers:)/i);
    
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
    
    // Parse answers section first
    const answerMap = new Map<number, string>();
    if (answersSection) {
      const answerLines = answersSection
        .replace(/^Answer Key:|^Answers:/i, "")
        .trim()
        .split("\n");
        
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
          }
        } else if (processingMCQ) {
          match = line.match(/^(\d+)\.\s*([a-zA-Z])(?:\))?$/i);
          if (match) {
            const questionNumber = parseInt(match[1]);
            const answer = match[2].trim().toLowerCase();
            answerMap.set(questionNumber, answer);
          }
        } else {
          // Try to identify answer type if not in a specific section
          const tfMatch = line.match(/^(\d+)\.\s*(True|False|T|F)$/i);
          if (tfMatch) {
            const questionNumber = parseInt(tfMatch[1]);
            let answer = tfMatch[2].trim();
            // Normalize T/F to True/False
            if (answer.toLowerCase() === 't') answer = 'True';
            if (answer.toLowerCase() === 'f') answer = 'False';
            answerMap.set(questionNumber, answer);
            return;
          }
          
          const mcqMatch = line.match(/^(\d+)\.\s*([a-zA-Z])(?:\))?$/i);
          if (mcqMatch) {
            const questionNumber = parseInt(mcqMatch[1]);
            const answer = mcqMatch[2].trim().toLowerCase();
            answerMap.set(questionNumber, answer);
            return;
          }
          
          // Generic answer line
          const genericMatch = line.match(/^(\d+)\.\s*(.+)$/);
          if (genericMatch) {
            const questionNumber = parseInt(genericMatch[1]);
            const answer = genericMatch[2].trim();
            answerMap.set(questionNumber, answer);
          }
        }
      });
    }
    
    // Parse True/False questions
    if (trueFalseSection) {
      const tfLines = trueFalseSection.replace(/^True\/False:/i, "").trim().split("\n");
      
      // Group lines by question number
      const questionBlocks: Record<string, string[]> = {};
      let currentQuestionNumber = "";
      
      tfLines.forEach(line => {
        const match = line.match(/^(\d+)\./);
        if (match) {
          currentQuestionNumber = match[1];
          questionBlocks[currentQuestionNumber] = [line];
        } else if (currentQuestionNumber && line.trim()) {
          questionBlocks[currentQuestionNumber].push(line);
        }
      });
      
      // Process each question block
      for (const [num, lines] of Object.entries(questionBlocks)) {
        const id = parseInt(num);
        const questionText = lines.join(" ").replace(/^\d+\.\s*/, "").trim();
        
        // Extract inline answer if available
        let answer = "";
        const inlineAnswerMatch = questionText.match(/\(([Tt]rue|[Ff]alse)\)/);
        if (inlineAnswerMatch) {
          answer = inlineAnswerMatch[1];
          // Normalize the answer
          answer = answer.toLowerCase() === "true" ? "True" : "False";
        }
        
        // Check answers section if no inline answer
        if (!answer && answerMap.has(id)) {
          const mappedAnswer = answerMap.get(id);
          if (mappedAnswer) {
            answer = mappedAnswer;
            if (answer.toLowerCase() === "true" || answer.toLowerCase() === "t") {
              answer = "True";
            } else if (answer.toLowerCase() === "false" || answer.toLowerCase() === "f") {
              answer = "False";
            }
          }
        }
        
        // Only add if we have a valid answer
        if (answer === "True" || answer === "False") {
          // Remove the inline answer from the question text if present
          const cleanQuestion = questionText.replace(/\s*\([Tt]rue|[Ff]alse\)\s*/, "").trim();
          
          result.questions.push({
            id,
            type: "true_false",
            question: cleanQuestion,
            correct_answer: answer
          });
        }
      }
    }
    
    // Parse Multiple Choice Questions
    if (mcqSection) {
      const mcqLines = mcqSection.replace(/^Multiple Choice Questions:/i, "").trim().split("\n");
      
      // Group lines by question number
      const questionBlocks: Record<string, string[]> = {};
      let currentQuestionNumber = "";
      
      mcqLines.forEach(line => {
        const match = line.match(/^(\d+)\./);
        if (match) {
          currentQuestionNumber = match[1];
          questionBlocks[currentQuestionNumber] = [line];
        } else if (currentQuestionNumber && line.trim()) {
          questionBlocks[currentQuestionNumber].push(line);
        }
      });
      
      // Process each question block
      for (const [num, lines] of Object.entries(questionBlocks)) {
        const id = parseInt(num);
        const fullText = lines.join(" ").trim();
        
        // Extract the question and options
        const optionsMatch = fullText.match(/^(\d+)\.\s*(.+?)\s+a\)\s+(.*?)\s+b\)\s+(.*?)\s+c\)\s+(.*?)(?:\s+d\)\s+(.*?))?(?:\s+e\)\s+(.*?))?/i);
        
        if (optionsMatch) {
          const question = optionsMatch[2].trim();
          const options: Record<string, string> = {
            "a": optionsMatch[3].trim(),
            "b": optionsMatch[4].trim(),
            "c": optionsMatch[5].trim()
          };
          
          // Add options d and e if present
          if (optionsMatch[6]) options["d"] = optionsMatch[6].trim();
          if (optionsMatch[7]) options["e"] = optionsMatch[7].trim();
          
          // Get answer from the answers section
          let answer = "";
          if (answerMap.has(id)) {
            answer = answerMap.get(id) || "";
          }
          
          // Only add if we have a valid answer
          if (answer && options[answer.toLowerCase()]) {
            result.questions.push({
              id,
              type: "mcq",
              question,
              options,
              correct_answer: answer.toLowerCase()
            });
          }
        }
      }
    }
    
    return JSON.stringify(result, null, 2);
  } catch (error) {
    console.error("Error converting text to JSON:", error);
    throw new Error("Failed to convert quiz text to JSON format");
  }
}