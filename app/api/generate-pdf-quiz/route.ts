import { NextResponse } from "next/server";
import { enhancedQuestionsSchema, pdfQuizParamsSchema } from "@/lib/schemas";
import { z } from "zod";
import { getLLMProvider } from "@/lib/llm-providers";

export const maxDuration = 60;

// Helper function to add a delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedParams = pdfQuizParamsSchema.parse(body);
    const firstFile = validatedParams.files[0].data;
    const fileName = validatedParams.files[0].name;

    // Add a small delay to make the progress bar more realistic
    await delay(1000);

    // Prepare the prompt based on the parameters
    const prompt = `
      Generate a quiz based on the content of the provided PDF document.
      The quiz should have exactly ${validatedParams.count} questions.
      Include the following question types: ${validatedParams.questionTypes.join(", ")}.

      QUESTION TYPES SPECIFICATIONS:
      1. For multiple-choice questions:
         - Provide exactly 4 options labeled A, B, C, and D
         - Make sure all options are plausible but only one is correct
         - Indicate the correct answer as A, B, C, or D
         - Include common misconceptions in the incorrect options

      2. For definition questions:
         - Provide a clear term to be defined
         - The correct answer should be a comprehensive definition
         - Include key characteristics and properties in the definition

      3. For problem-solving questions:
         - Provide a clear problem statement that requires calculation or analysis
         - The correct answer should include the final result with appropriate units
         - Include a detailed step-by-step solution process

      EXPLANATION REQUIREMENTS:
      For ALL question types, provide a detailed, step-by-step explanation that:
      1. Starts by clearly stating the correct answer
      2. Explains WHY this answer is correct using scientific principles
      3. Breaks down the reasoning into NUMBERED STEPS (at least 5-7 detailed steps)
      4. For each step, include:
         - The specific principle, law, or concept being applied
         - The mathematical formula with proper LaTeX notation
         - How this step builds on previous steps
         - A clear explanation of WHY this step is necessary
      5. For multiple-choice questions, explain why each incorrect option is wrong
      6. For problem-solving questions:
         - Show ALL mathematical work with intermediate calculations
         - Explain the significance of each variable and constant
         - Demonstrate unit conversions and dimensional analysis
         - Highlight common mistakes students might make
      7. Connect the concept to the broader topic
      8. Include a "Key Takeaway" section at the end summarizing the main learning points

      MATHEMATICAL NOTATION REQUIREMENTS:
      CRITICAL: For all mathematical formulas, equations, and expressions, use proper LaTeX notation with dollar signs.

      ALWAYS USE BRACES FOR SUBSCRIPTS AND SUPERSCRIPTS:
      - Use $v_{0}$ instead of $v_0$
      - Use $a_{x}$ instead of $a_x$
      - Use $F_{net}$ instead of $F_net$
      - Use $10^{-3}$ instead of $10^-3$
      - Use $\theta^{\circ}$ for degrees, not $\theta^\circ$ or $\theta\circ$

      CRITICAL FOR PHYSICS FORMULAS:
      - For angles with velocity: ALWAYS separate angle and variable with a space: $45^{\circ} \cdot v_{0}$ not $45^{\circ}v_{0}$
      - For equations with exponents: ALWAYS use braces: $20^{0}$ not $20^0$
      - For double exponents (like degrees with variables): ALWAYS use proper spacing: $45^{\circ} \cdot v_{0}^{2}$ not $45^{\circ}v_{0}^{2}$
      - For fractions with variables: ALWAYS use braces: $\frac{1}{2}g(v_{\text{total}})^{2}$ not $\frac{1}{2}g(v_total)^2$
      - ALWAYS use braces for ALL subscripts and superscripts without exception
      - ALWAYS use \text{} for text within math: $v_{\text{total}}$ not $v_{total}$
      - NEVER place exponents directly next to variables with subscripts without proper spacing

      ALWAYS USE PROPER LATEX COMMANDS FOR FUNCTIONS:
      - Use $\cos(\theta)$ instead of $cos(\theta)$
      - Use $\sin(\theta)$ instead of $sin(\theta)$
      - Use $\tan(\theta)$ instead of $tan(\theta)$
      - Use $\log(x)$ instead of $log(x)$

      ALWAYS USE PROPER LATEX COMMANDS FOR GREEK LETTERS:
      - Use $\theta$ instead of $theta$
      - Use $\alpha$ instead of $alpha$
      - Use $\omega$ instead of $omega$

      EXAMPLES OF CORRECT FORMATTING:
      - "The velocity is $v = 5$ m/s"
      - "The initial velocity is $v_{0} = 10$ m/s"
      - "The angle is $\theta = 30^{\circ}$"
      - "The acceleration is $a = 9.8$ m/s$^{2}$"
      - "The formula $F = ma$"
      - "The equation $E = mc^{2}$"
      - "The horizontal component is $v_{x} = v_{0}\cos(\theta)$"
      - "The vertical component is $v_{y} = v_{0}\sin(\theta)$"

      RESPONSE FORMAT:
      You must format your response as a valid JSON object with the following structure:
      {
        "questions": [
          {
            "type": "multiple-choice",
            "question": "Question text with $LaTeX$ formulas if needed",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "A",
            "explanation": "**Correct Answer: A**\n\n**Step 1: Understanding the concept**\nThe principle of [concept] states that $F = ma$, where $F$ is force, $m$ is mass, and $a$ is acceleration. This fundamental relationship shows that...\n\n**Step 2: Analyzing the question**\nIn this problem, we need to determine [specific analysis]. The key insight is that...\n\n**Step 3: Application of relevant formula**\nWe can apply the formula $E = \\frac{1}{2}mv^2$ to calculate the kinetic energy. This formula is derived from...\n\n**Step 4: Calculation process**\nSubstituting the values: $m = 2$ kg and $v = 5$ m/s, we get:\n$E = \\frac{1}{2} \\times 2 \\times 5^2 = \\frac{1}{2} \\times 2 \\times 25 = 25$ J\n\n**Step 5: Evaluation of options**\nOption A (25 J) matches our calculation and is correct.\nOption B (50 J) is incorrect because it fails to include the $\\frac{1}{2}$ factor in the kinetic energy formula.\nOption C (10 J) is incorrect because it uses the wrong value for velocity.\nOption D (5 J) is incorrect because it confuses kinetic energy with momentum.\n\n**Step 6: Broader context**\nThis concept relates to the conservation of energy principle, specifically under Topic 2.3...\n\n**Key Takeaway:**\nKinetic energy depends on both mass and the square of velocity, making velocity changes more significant than mass changes for the same proportional change."
          },
          {
            "type": "definition",
            "question": "Define the term X",
            "correctAnswer": "Definition with $LaTeX$ formulas if needed",
            "explanation": "**Correct Definition:**\nEnthalpy ($H$) is a thermodynamic property of a system defined as the sum of the internal energy ($U$) plus the product of pressure ($P$) and volume ($V$): $H = U + PV$. It represents the total heat content of a system at constant pressure.\n\n**Step 1: Etymology and historical context**\nThe term 'enthalpy' comes from the Greek word 'enthalpein' meaning 'to heat'. It was introduced by Heike Kamerlingh Onnes in 1909 to...\n\n**Step 2: Mathematical definition**\nEnthalpy is defined by the equation $H = U + PV$, where:\n- $H$ is enthalpy (measured in joules, J)\n- $U$ is internal energy (J)\n- $P$ is pressure (pascals, Pa)\n- $V$ is volume (cubic meters, m³)\n\n**Step 3: Physical interpretation**\nEnthalpy represents the total heat content available in a thermodynamic system. The key insight is that...\n\n**Step 4: Relationship to other thermodynamic properties**\nEnthalpy is related to Gibbs free energy ($G$) through the equation $G = H - TS$, where $T$ is temperature and $S$ is entropy. This relationship is important because...\n\n**Step 5: Applications in chemistry**\nIn chemical reactions, we often measure the change in enthalpy ($\\Delta H$) rather than absolute enthalpy. For a reaction at constant pressure, $\\Delta H$ equals the heat transferred ($q_p$): $\\Delta H = q_p$. This is crucial for understanding...\n\n**Key Takeaway:**\nEnthalpy is a state function that helps us track energy changes in chemical and physical processes, particularly useful for processes occurring at constant pressure like most laboratory reactions."
          },
          {
            "type": "problem-solving",
            "question": "Problem statement with $LaTeX$ formulas if needed",
            "correctAnswer": "Final answer with $LaTeX$ formulas if needed",
            "steps": [
              "Step 1: Initial setup - Identify the relevant formula: $E = mc^2$",
              "Step 2: Identify known variables - Mass $m = 5$ kg, speed of light $c = 3 \\times 10^8$ m/s",
              "Step 3: Substitute values - $E = 5 \\times (3 \\times 10^8)^2$ J",
              "Step 4: Calculate intermediate result - $c^2 = 9 \\times 10^{16}$ m²/s²",
              "Step 5: Calculate final answer - $E = 5 \\times 9 \\times 10^{16} = 4.5 \\times 10^{17}$ J",
              "Step 6: Verify units - Energy is measured in joules (J)"
            ],
            "explanation": "**Correct Answer: $E = 4.5 \\times 10^{17}$ J**\n\n**Step 1: Understanding the physical principle**\nThis problem involves Einstein's mass-energy equivalence principle, expressed by the equation $E = mc^2$. This fundamental relationship shows that mass and energy are equivalent and can be converted from one form to another.\n\n**Step 2: Identifying the relevant variables**\nIn this problem, we have:\n- Mass: $m = 5$ kg\n- Speed of light: $c = 3 \\times 10^8$ m/s\n- We need to find: Energy ($E$) in joules (J)\n\n**Step 3: Setting up the calculation**\nWe'll use the formula $E = mc^2$ directly. This formula comes from Einstein's Special Theory of Relativity (1905) and represents one of the most famous equations in physics.\n\n**Step 4: Calculating the square of the speed of light**\nFirst, we need to calculate $c^2$:\n$c^2 = (3 \\times 10^8)^2 = 9 \\times 10^{16}$ m²/s²\n\n**Step 5: Multiplying by the mass**\nNow we multiply the mass by $c^2$:\n$E = m \\times c^2 = 5 \\times 9 \\times 10^{16} = 45 \\times 10^{16} = 4.5 \\times 10^{17}$ J\n\n**Step 6: Analyzing the units**\nLet's verify that our units are correct:\n- Mass is in kg\n- Speed of light squared is in m²/s²\n- When multiplied: kg × m²/s² = kg·m²/s² = J (joules)\n\n**Key Takeaway:**\nEinstein's equation $E = mc^2$ demonstrates the fundamental equivalence of mass and energy, showing that a small amount of mass can be converted into an enormous amount of energy."
          }
        ]
      }

      IMPORTANT RULES:
      1. Do NOT include any text outside the JSON structure
      2. Do NOT include markdown code blocks or backticks
      3. Ensure all JSON keys and values are properly quoted
      4. Ensure the JSON is valid and can be parsed
      5. Include exactly ${validatedParams.count} questions in the array
      6. Make sure each question has all required fields based on its type
      7. Ensure all LaTeX notation is properly escaped for JSON
    `;

    try {
      // System prompt for the quiz generation
      const systemPrompt = "You are a teacher. Your job is to take a document and create a quiz based on the content of the document. The quiz should test understanding of key concepts and information from the document.\n\nCRITICAL FORMATTING REQUIREMENTS:\n1. Always use proper LaTeX notation for ALL mathematical formulas, equations, and expressions.\n2. ALWAYS use braces for subscripts and superscripts: $v_{0}$ not $v_0$, $a_{x}$ not $a_x$, $10^{-3}$ not $10^-3$.\n3. ALWAYS use proper LaTeX commands for functions: $\\cos(\\theta)$ not $cos(\\theta)$, $\\sin(\\theta)$ not $sin(\\theta)$.\n4. ALWAYS use proper LaTeX commands for Greek letters: $\\theta$ not $theta$, $\\alpha$ not $alpha$.\n5. For degrees, use $30^{\\circ}$ not $30\\circ$ or $30^\\circ$.\n6. ALWAYS separate angle measurements from variables with a space or multiplication symbol: $45^{\\circ} \\cdot v_{0}$ not $45^{\\circ}v_{0}$.\n7. ALWAYS use \\text{} for text within math: $v_{\\text{total}}$ not $v_{total}$.\n8. NEVER place exponents directly next to variables with subscripts without proper spacing.\n9. Format explanations in a clear, step-by-step manner with proper headings and structure.\n\nCRITICAL FOR PHYSICS FORMULAS:\n1. For angles with velocity: ALWAYS separate angle and variable with a space: $45^{\\circ} \\cdot v_{0}$ not $45^{\\circ}v_{0}$\n2. For equations with exponents: ALWAYS use braces: $20^{0}$ not $20^0$\n3. For double exponents (like degrees with variables): ALWAYS use proper spacing: $45^{\\circ} \\cdot v_{0}^{2}$ not $45^{\\circ}v_{0}^{2}$\n4. For fractions with variables: ALWAYS use braces: $\\frac{1}{2}g(v_{\\text{total}})^{2}$ not $\\frac{1}{2}g(v_total)^2$\n5. ALWAYS use braces for ALL subscripts and superscripts without exception\n6. ALWAYS use \\text{} for text within math: $v_{\\text{total}}$ not $v_{total}$\n7. NEVER place exponents directly next to variables with subscripts without proper spacing";

      // Get the LLM provider
      console.log("Getting LLM provider...");
      const llmProvider = await getLLMProvider();
      console.log("LLM provider obtained");

      // Generate content using the provider
      console.log("Generating content...");
      const response = await llmProvider.generateContent(prompt, systemPrompt, {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 8192,
        title: "PDF Quiz Generator",
        // Pass the PDF file data
        file: {
          data: firstFile,
          mimeType: "application/pdf"
        }
      });

      // Get the generation ID for progress tracking
      const generationId = response.id;
      console.log("Generation ID:", generationId);

      // Get the response text
      const fullContent = response.text;
      console.log("API Response (first 100 chars):", fullContent.substring(0, 100));

      // Construct the data object for compatibility with existing code
      const data = {
        id: generationId || "response-id",
        choices: [{ message: { content: fullContent } }]
      };

      try {
        let parsedContent;

        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
          const content = data.choices[0].message.content;

          try {
            // Try to parse the content as JSON directly
            parsedContent = JSON.parse(content);
          } catch (parseError) {
            console.error("Error parsing JSON directly:", parseError);

            // If direct parsing fails, try to extract JSON using regex
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                // First attempt: Try to parse the extracted JSON directly
                let extractedJson = jsonMatch[0];

                try {
                  parsedContent = JSON.parse(extractedJson);
                } catch (initialExtractError) {
                  console.log("Initial extract parse failed, attempting to fix LaTeX backslashes");

                  // Second attempt: Apply LaTeX escaping fixes
                  try {
                    // Replace \\ with a temporary placeholder
                    let fixedJson = extractedJson.replace(/\\\\/g, "DOUBLE_BACKSLASH_PLACEHOLDER");

                    // Replace single backslashes that are likely part of LaTeX with double backslashes
                    fixedJson = fixedJson.replace(/\\([a-zA-Z]+|[^a-zA-Z])/g, "\\\\$1");

                    // Restore original double backslashes
                    fixedJson = fixedJson.replace(/DOUBLE_BACKSLASH_PLACEHOLDER/g, "\\\\");

                    // Fix common LaTeX escaping issues
                    fixedJson = fixedJson
                      // Fix escaped quotes inside strings
                      .replace(/\\\\"/g, '\\\\"')
                      // Fix double escaped backslashes
                      .replace(/\\\\\\\\/g, "\\\\\\\\")
                      // Fix escaped braces
                      .replace(/\\\\{/g, "\\\\{")
                      .replace(/\\\\}/g, "\\\\}")
                      // Fix escaped dollars
                      .replace(/\\\\$/g, "\\\\$");

                    console.log("Attempting to parse fixed JSON");
                    parsedContent = JSON.parse(fixedJson);
                    console.log("Successfully parsed fixed JSON");
                  } catch (fixedExtractError) {
                    console.error("Fixed extract parse also failed:", fixedExtractError);

                    // Third attempt: Try more aggressive fixing
                    try {
                      // More aggressive approach: replace all backslashes with double backslashes
                      let aggressiveFixedJson = extractedJson.replace(/\\/g, "\\\\");

                      // Fix double escaped quotes
                      aggressiveFixedJson = aggressiveFixedJson.replace(/\\\\\"/g, '\\"');

                      console.log("Attempting aggressive JSON fixing");
                      parsedContent = JSON.parse(aggressiveFixedJson);
                      console.log("Successfully parsed with aggressive fixing");
                    } catch (aggressiveFixError) {
                      console.error("Aggressive fix also failed:", aggressiveFixError);
                      throw new Error("Failed to parse extracted JSON after multiple attempts");
                    }
                  }
                }
              } catch (extractError) {
                console.error("Error parsing extracted JSON:", extractError);

                // If that fails too, try to extract the questions array
                const questionsMatch = content.match(/"questions"\s*:\s*\[([\s\S]*?)\]/);
                if (questionsMatch) {
                  try {
                    // Try to parse individual question objects
                    const questionsStr = questionsMatch[0];
                    const questionObjects = questionsStr.match(/\{[\s\S]*?\}/g);

                    if (questionObjects) {
                      // Parse each question individually
                      const questions = [];
                      for (const qObj of questionObjects) {
                        try {
                          // Extract fields using regex
                          const typeMatch = qObj.match(/"type"\s*:\s*"([^"]+)"/);
                          const questionMatch = qObj.match(/"question"\s*:\s*"([^"]+)"/);
                          const correctAnswerMatch = qObj.match(/"correctAnswer"\s*:\s*"([^"]+)"/);
                          const explanationMatch = qObj.match(/"explanation"\s*:\s*"([^"]+)"/);

                          // For multiple choice, extract options
                          const optionsMatch = qObj.match(/"options"\s*:\s*\[([\s\S]*?)\]/);
                          let options: string[] = [];

                          if (optionsMatch && optionsMatch[1]) {
                            options = optionsMatch[1].split(/",\s*"/).map((opt: string) => {
                              return opt.replace(/^"/, '').replace(/"$/, '');
                            });
                          }

                          // Create question object with proper typing
                          const question: {
                            type: string;
                            question: string;
                            correctAnswer: string;
                            explanation: string;
                            options?: string[];
                            steps?: string[];
                          } = {
                            type: typeMatch ? typeMatch[1] : "unknown",
                            question: questionMatch ? questionMatch[1].replace(/\\"/g, '"') : "Unknown question",
                            correctAnswer: correctAnswerMatch ? correctAnswerMatch[1].replace(/\\"/g, '"') : "",
                            explanation: explanationMatch ? explanationMatch[1].replace(/\\"/g, '"') : ""
                          };

                          if (options.length > 0) {
                            question.options = options;
                          }

                          // For problem-solving, extract steps
                          const stepsMatch = qObj.match(/"steps"\s*:\s*\[([\s\S]*?)\]/);
                          if (stepsMatch && stepsMatch[1]) {
                            const steps = stepsMatch[1].split(/",\s*"/).map((step: string) => {
                              return step.replace(/^"/, '').replace(/"$/, '');
                            });
                            question.steps = steps;
                          }

                          questions.push(question);
                        } catch (qError) {
                          console.error("Error parsing individual question:", qError);
                        }
                      }

                      if (questions.length > 0) {
                        parsedContent = { questions };
                      } else {
                        throw new Error("Failed to extract any questions");
                      }
                    }
                  } catch (arrayError) {
                    console.error("Error parsing questions array:", arrayError);
                    throw new Error("Failed to parse questions array");
                  }
                } else {
                  throw new Error("Failed to extract questions array");
                }
              }
            } else {
              throw new Error("Failed to extract JSON from response");
            }
          }
        } else {
          throw new Error("Invalid API response format");
        }

        // Check if questions array exists
        if (!parsedContent.questions || !Array.isArray(parsedContent.questions)) {
          console.error("Invalid response format:", parsedContent);
          return NextResponse.json(
            { error: "Invalid response format from API" },
            { status: 500 }
          );
        }

        // Process the questions
        const questions = parsedContent.questions.map((q: any, index: number) => ({
          ...q,
          id: `q-${index}`,
        }));

        // Validate the questions against our schema
        const validationResult = enhancedQuestionsSchema.safeParse(questions);
        if (!validationResult.success) {
          console.error("Validation error:", validationResult.error);
          return NextResponse.json(
            { error: "Failed to validate questions" },
            { status: 500 }
          );
        }

        // Get the generation ID from the response
        const generationId = data.id || response.id || null;

        console.log("PDF Quiz Generation ID:", generationId);

        return NextResponse.json({
          questions,
          generationId
        });
      } catch (error) {
        console.error("Error parsing API response:", error);

        // Generate mock questions as a fallback
        const mockQuestions = generateMockQuestions(
          validatedParams.questionTypes,
          validatedParams.count
        );

        return NextResponse.json({
          questions: mockQuestions,
          generationId: `mock-${Date.now()}`,
          note: "Using mock data due to parsing error"
        });
      }
    } catch (apiError) {
      console.error("API call error:", apiError);

      // Generate mock questions as a fallback
      const mockQuestions = generateMockQuestions(
        validatedParams.questionTypes,
        validatedParams.count
      );

      return NextResponse.json({
        questions: mockQuestions,
        generationId: `mock-${Date.now()}`,
        note: "Using mock data due to API call error"
      });
    }
  } catch (error) {
    console.error("Error generating quiz:", error);

    // Generate mock questions as a fallback
    const mockQuestions = generateMockQuestions(
      ["multiple-choice"],
      5
    );

    return NextResponse.json({
      questions: mockQuestions,
      generationId: `mock-${Date.now()}`,
      note: "Using mock data due to error"
    });
  }
}

// Function to generate mock questions for testing
function generateMockQuestions(
  questionTypes: string[],
  count: number
) {
  const questions = [];

  for (let i = 0; i < count; i++) {
    const questionType = questionTypes[i % questionTypes.length];

    if (questionType === "multiple-choice") {
      questions.push({
        id: `q-${i}`,
        type: "multiple-choice",
        question: "What is a key concept in the document?",
        options: [
          "First possible answer",
          "Second possible answer",
          "Third possible answer",
          "Fourth possible answer"
        ],
        correctAnswer: "A",
        explanation: "This is an explanation of the correct answer for this question."
      });
    } else if (questionType === "definition") {
      questions.push({
        id: `q-${i}`,
        type: "definition",
        question: "Define the following term from the document:",
        correctAnswer: "This is the definition of a term from the document.",
        explanation: "This is an explanation of why this definition is important."
      });
    } else if (questionType === "problem-solving") {
      questions.push({
        id: `q-${i}`,
        type: "problem-solving",
        question: "Solve this problem related to the document:",
        correctAnswer: "This is the solution to the problem.",
        steps: [
          "Step 1 of solving the problem",
          "Step 2 of solving the problem",
          "Step 3 of solving the problem"
        ],
        explanation: "This is an explanation of the problem-solving approach."
      });
    }
  }

  return questions;
}
