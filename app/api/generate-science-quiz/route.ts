import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getLLMProvider } from '@/lib/llm-providers';

// Define the schema for the quiz generation parameters
const quizParamsSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  subject: z.string().default("physics"),
  count: z.number().min(3).max(40).default(5),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  questionTypes: z.array(
    z.enum(["multiple-choice", "definition", "problem-solving", "long-answer"])
  ).min(1, "At least one question type is required"),
});

// Helper function to add a delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedParams = quizParamsSchema.parse(body);

    // Add a small delay to make the progress bar more realistic
    await delay(2000);

    // No additional context from external sources
    let additionalContext = "";

    // Prepare the prompt based on the parameters
    const prompt = `
      Generate a quiz on the topic of "${validatedParams.topic}" for IB DP students in the subject of ${validatedParams.subject}.
      The quiz should have exactly ${validatedParams.count} questions with ${validatedParams.difficulty} difficulty.

      Include the following question types: ${validatedParams.questionTypes.join(", ")}.

      ${additionalContext}

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

      4. For long-answer questions:
         - Provide a clear, open-ended question that requires a textual, explanatory answer.
         - The question should prompt critical thinking, analysis, or detailed explanation rather than a short factual recall.
         - Specify if any particular grading criteria or key points should be included by the student in their answer. If so, provide these as 'gradingCriteria'.

      EXPLANATION REQUIREMENTS:
      For ALL question types, provide a detailed, step-by-step explanation as an ARRAY OF STRINGS. Each string in the array represents one clear step in the thought process. The goal is to guide the user through HOW to arrive at the solution, focusing on pedagogical value.
      The explanation should:
      1. Begin with a string that clearly states the correct answer (e.g., "Correct Answer: A" or "Correct Definition: Enthalpy is...").
      2. Subsequent strings in the array should break down the reasoning into logical, sequential steps. Aim for at least 5-7 detailed steps.
      3. Each step (each string in the array) should:
         - Clearly articulate the action or thought process for that step (e.g., "First, recall the relevant concept: Newton's Second Law.", "Next, identify the given values from the problem statement: mass (m) = 2kg, acceleration (a) = 3 m/s².").
         - Explain the scientific principle, law, or concept being applied in that step.
         - If a mathematical formula is used, state it clearly with proper LaTeX notation (e.g., "Apply the formula: $F = ma$.").
         - Show how this step builds on previous steps or prepares for subsequent ones.
         - Explain WHY this step is necessary for solving the problem.
      4. For multiple-choice questions, after the main step-by-step reasoning for the correct answer, include steps explaining why EACH incorrect option is wrong.
      5. For problem-solving questions:
         - Show ALL mathematical work, including intermediate calculations, within the relevant steps.
         - Explain the significance of each variable and constant used.
         - Demonstrate unit conversions and dimensional analysis as part of the steps.
         - Highlight common mistakes students might make and how to avoid them within the steps or as a concluding step.
      6. Connect the overall concept to the broader topic and, if applicable, the IB curriculum in one of the concluding steps.
      7. Conclude with a "Key Takeaway" string summarizing the main learning points.
      Example of a step: "Step 3: Apply the formula for kinetic energy. Kinetic energy is given by $E_k = \\frac{1}{2}mv^2$. We use this formula because the question asks for the energy of motion."

      HINTS REQUIREMENTS:
      For EACH question, generate exactly 5 distinct hints.
      These hints should progressively become more obvious and helpful.
      - Hint 1: A general nudge or concept reminder.
      - Hint 2: Points to a specific formula or area of knowledge.
      - Hint 3: Provides a small step, calculation, or piece of information.
      - Hint 4: Provides a more significant step or reveals more information.
      - Hint 5: Almost gives away the answer or the direct method to solve it.
      Ensure each hint is a concise string.

      MATHEMATICAL NOTATION REQUIREMENTS:
      CRITICAL: For all mathematical formulas, equations, and expressions, use proper LaTeX notation with dollar signs.

      ALWAYS USE BRACES FOR SUBSCRIPTS AND SUPERSCRIPTS:
      - Use $v_{0}$ instead of $v_0$
      - Use $a_{x}$ instead of $a_x$
      - Use $F_{net}$ instead of $F_net$
      - Use $10^{-3}$ instead of $10^-3$
      - Use $\\theta^{\\circ}$ for degrees, not $\\theta^\\circ$ or $\\theta\\circ$

      CRITICAL FOR PHYSICS FORMULAS:
      - For angles with velocity: ALWAYS separate angle and variable with a space: $45^{\\circ} \\cdot v_{0}$ not $45^{\\circ}v_{0}$
      - For equations with exponents: ALWAYS use braces: $20^{0}$ not $20^0$
      - For double exponents (like degrees with variables): ALWAYS use proper spacing: $45^{\\circ} \\cdot v_{0}^{2}$ not $45^{\\circ}v_{0}^{2}$
      - For fractions with variables: ALWAYS use braces: $\\frac{1}{2}g(v_{\\text{total}})^{2}$ not $\\frac{1}{2}g(v_total)^2$
      - ALWAYS use braces for ALL subscripts and superscripts without exception
      - ALWAYS use \\text{} for text within math: $v_{\\text{total}}$ not $v_{total}$
      - NEVER place exponents directly next to variables with subscripts without proper spacing

      ALWAYS USE PROPER LATEX COMMANDS FOR FUNCTIONS:
      - Use $\\cos(\\theta)$ instead of $cos(\\theta)$
      - Use $\\sin(\\theta)$ instead of $sin(\\theta)$
      - Use $\\tan(\\theta)$ instead of $tan(\\theta)$
      - Use $\\log(x)$ instead of $log(x)$

      ALWAYS USE PROPER LATEX COMMANDS FOR GREEK LETTERS:
      - Use $\\theta$ instead of $theta$
      - Use $\\alpha$ instead of $alpha$
      - Use $\\omega$ instead of $omega$

      EXAMPLES OF CORRECT FORMATTING:
      - "The velocity is $v = 5$ m/s"
      - "The initial velocity is $v_{0} = 10$ m/s"
      - "The angle is $\\theta = 30^{\\circ}$"
      - "The acceleration is $a = 9.8$ m/s$^{2}$"
      - "The formula $F = ma$"
      - "The equation $E = mc^{2}$"
      - "The horizontal component is $v_{x} = v_{0}\\cos(\\theta)$"
      - "The vertical component is $v_{y} = v_{0}\\sin(\\theta)$"
      - For complex equations, use double dollar signs: "$$E = \\frac{V}{r} \\ln\\left(\\frac{d}{r}\\right)$$"

      Always wrap mathematical symbols, variables, and equations in dollar signs ($...$) for inline formulas or double dollar signs ($$...$$) for displayed equations.

      RESPONSE FORMAT:
      You must format your response as a valid JSON object with the following structure:
      {
        "questions": [
          {
            "type": "multiple-choice",
            "question": "Question text with $LaTeX$ formulas",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "A",
            "hints": [
              "Hint 1: Think about the basic definition of this type of energy.",
              "Hint 2: Recall the formula that relates mass and velocity to this energy.",
              "Hint 3: Ensure you are using the correct factor (e.g., 1/2) in the formula.",
              "Hint 4: Double-check your squaring operations.",
              "Hint 5: The formula is $E_k = \\frac{1}{2}mv^2$. Substitute the given values."
            ],
            "explanation": [
              "Correct Answer: A",
              "Step 1: Understanding the concept. The question asks for kinetic energy. Kinetic energy is the energy an object possesses due to its motion. The relevant principle is the definition of kinetic energy.",
              "Step 2: Recall the formula for kinetic energy. The formula for kinetic energy ($E_k$) is $E_k = \\frac{1}{2}mv^2$, where $m$ is mass and $v$ is velocity. This formula is fundamental in classical mechanics.",
              "Step 3: Identify the given values. From the problem, mass ($m$) = 2 kg and velocity ($v$) = 5 m/s. It's important to note the units.",
              "Step 4: Substitute the values into the formula. $E_k = \\frac{1}{2} \\times (2 \\text{ kg}) \\times (5 \\text{ m/s})^2$. This step involves direct substitution.",
              "Step 5: Perform the calculation. First, square the velocity: $(5 \\text{ m/s})^2 = 25 \\text{ m}^2/\\text{s}^2$. Then, multiply by the mass and $\\frac{1}{2}$: $E_k = \\frac{1}{2} \\times 2 \\text{ kg} \\times 25 \\text{ m}^2/\\text{s}^2 = 1 \\text{ kg} \\times 25 \\text{ m}^2/\\text{s}^2 = 25 \\text{ J}$. The unit kg·m²/s² is equivalent to Joules (J).",
              "Step 6: Evaluate the options. Option A (25 J) matches our calculation.",
              "Step 7: Analyze incorrect options. Option B (50 J) is incorrect; this would result if the $\\frac{1}{2}$ factor was omitted ($2 \\times 25 = 50$). Option C (10 J) is incorrect; this might arise from an arithmetic error or misremembering the formula (e.g., $m \\times v = 2 \\times 5 = 10$, which is momentum, not energy). Option D (5 J) is incorrect; this could be a miscalculation or misunderstanding of the relationship between variables.",
              "Step 8: Broader context. This problem relates to the concept of energy in physics, specifically mechanical energy, which is a core part of the IB Physics curriculum (Topic 2: Mechanics).",
              "Key Takeaway: Kinetic energy is proportional to mass and the square of velocity. Always ensure you use the correct formula ($E_k = \\frac{1}{2}mv^2$) and perform calculations carefully, paying attention to units."
            ]
          },
          {
            "type": "definition",
            "question": "Define the term X",
            "correctAnswer": "Definition with $LaTeX$ formulas if needed",
            "hints": [
               "Hint 1: What is the general field this term belongs to?",
               "Hint 2: Think about its constituent parts or what it's composed of.",
               "Hint 3: What is its primary purpose or what does it measure?",
               "Hint 4: Recall the mathematical formula that defines it.",
               "Hint 5: It's defined as $H = U + PV$."
            ],
            "explanation": [
             "Correct Definition: Enthalpy ($H$) is a thermodynamic property of a system defined as the sum of the internal energy ($U$) plus the product of pressure ($P$) and volume ($V$): $H = U + PV$. It represents the total heat content of a system at constant pressure.",
             "Step 1: Identify the core components of the definition. The definition involves internal energy ($U$), pressure ($P$), and volume ($V$).",
             "Step 2: State the mathematical formula. Enthalpy is expressed by the equation $H = U + PV$. This is the foundational mathematical representation.",
             "Step 3: Explain the physical meaning. Enthalpy quantifies the total heat content of a system when pressure is held constant. This is particularly useful for chemical reactions carried out in open containers.",
             "Step 4: Discuss its units. Enthalpy, like other forms of energy, is typically measured in Joules (J) or kilojoules (kJ).",
             "Step 5: Elaborate on its significance. Enthalpy is a state function, meaning its value depends only on the current state of the system, not on how it reached that state. Changes in enthalpy ($\\Delta H$) are crucial for studying heat changes in chemical reactions (exothermic or endothermic).",
             "Step 6: Connect to practical applications. For example, the enthalpy of combustion ($\\Delta H_c$) measures the heat released when a substance burns completely. This is vital in fields like fuel science and engineering.",
             "Step 7: Relate to the IB curriculum. In IB Chemistry, enthalpy is a key concept in Topic 5 (Energetics/Thermochemistry) and Topic 15 (Advanced Energetics/Thermochemistry for HL).",
             "Key Takeaway: Enthalpy ($H = U + PV$) is a measure of a system's total heat content at constant pressure, essential for understanding energy changes in chemical and physical processes."
           ]
          },
          {
            "type": "problem-solving",
            "question": "Problem statement with $LaTeX$ formulas",
            "correctAnswer": "Final answer with $LaTeX$ formulas, e.g., $E = 4.5 \\times 10^{17}$ J",
            "hints": [
               "Hint 1: What fundamental principle relates mass and energy?",
               "Hint 2: Recall the famous equation by Einstein involving $E$, $m$, and $c$.",
               "Hint 3: Remember to square the speed of light ($c$).",
               "Hint 4: The value of $c$ is approximately $3 \\times 10^8$ m/s.",
               "Hint 5: Use $E = mc^2$. Substitute $m=5$ kg and $c=3 \\times 10^8$ m/s, then calculate."
            ],
            "explanation": [
              "Correct Answer: $E = 4.5 \\times 10^{17}$ J",
              "Step 1: Understand the physical principle. This problem uses Einstein's mass-energy equivalence, $E=mc^2$, which states that energy ($E$) and mass ($m$) are interconvertible, related by the square of the speed of light ($c$).",
              "Step 2: Identify known variables and the unknown. Given: mass $m = 5$ kg. The speed of light $c$ is a constant, approximately $3 \\times 10^8$ m/s. Unknown: Energy $E$.",
              "Step 3: Write down the formula. The formula to use is $E = mc^2$. This is a cornerstone of modern physics.",
              "Step 4: Calculate $c^2$. $(3 \\times 10^8 \\text{ m/s})^2 = (3^2) \\times (10^8)^2 \\text{ m}^2/\\text{s}^2 = 9 \\times 10^{16} \\text{ m}^2/\\text{s}^2$. Be careful with squaring the power of 10.",
              "Step 5: Substitute the values of $m$ and $c^2$ into the formula. $E = (5 \\text{ kg}) \\times (9 \\times 10^{16} \\text{ m}^2/\\text{s}^2)$.",
              "Step 6: Perform the multiplication. $E = (5 \\times 9) \\times 10^{16} \\text{ kg} \\cdot \\text{m}^2/\\text{s}^2 = 45 \\times 10^{16} \\text{ J}$.",
              "Step 7: Express the answer in standard scientific notation. $45 \\times 10^{16} \\text{ J} = 4.5 \\times 10^1 \\times 10^{16} \\text{ J} = 4.5 \\times 10^{17} \\text{ J}$.",
              "Step 8: Verify units. The unit kg·m²/s² is the definition of a Joule (J), which is the standard unit of energy. The units are consistent.",
              "Common Mistake: A common error is forgetting to square the speed of light, or making a mistake in calculating $(10^8)^2$. It is $10^{16}$, not $10^{10}$ or $10^6$.",
              "Key Takeaway: Mass-energy equivalence ($E=mc^2$) shows that a small amount of mass can be converted into a very large amount of energy, due to the large value of $c^2$. This is the principle behind nuclear energy."
            ]
          },
          {
            "type": "long-answer",
            "question": "Explain the concept of inertia and provide two real-world examples. Discuss how Newton's First Law of Motion relates to inertia.",
            "gradingCriteria": "The answer should clearly define inertia, provide two distinct and relevant real-world examples, and accurately explain the connection to Newton's First Law. Key points: definition of inertia (resistance to change in motion), examples (e.g., passenger in a stopping car, pulling a tablecloth from under dishes), Newton's First Law (object at rest stays at rest, object in motion stays in motion unless acted upon by a net force).",
            "hints": [
               "Hint 1: Think about what makes it hard to start moving a heavy object or stop a moving one.",
               "Hint 2: Consider everyday situations where you experience a resistance to changes in your state of motion.",
               "Hint 3: Recall Newton's laws of motion. Which one specifically deals with objects maintaining their current state of motion?",
               "Hint 4: One example could involve a vehicle. Another could involve an object at rest.",
               "Hint 5: Inertia is the tendency of an object to resist changes in its state of motion. Newton's First Law is often called the law of inertia."
            ],
            "explanation": [
             "Ideal Answer Outline:",
             "Step 1: Define Inertia. Inertia is the natural tendency of an object to resist changes in its state of motion. This means an object at rest wants to stay at rest, and an object moving at a constant velocity wants to continue moving at that velocity. Inertia is directly proportional to an object's mass – more mass means more inertia.",
             "Step 2: Provide Real-World Example 1. Example: A passenger in a car that suddenly brakes. The passenger continues to move forward relative to the car. This is because the passenger's body, due to inertia, tends to maintain its original state of motion (moving forward with the car's initial velocity). The seatbelt then applies an external force to change the passenger's state of motion.",
             "Step 3: Provide Real-World Example 2. Example: Trying to push a heavy box across the floor. It's harder to get the box moving from rest than a lighter box. Once moving, it's also harder to stop the heavy box. This is because the heavy box has more mass and therefore more inertia, resisting changes to its velocity (either from 0 m/s or to 0 m/s).",
             "Step 4: State Newton's First Law of Motion. Newton's First Law (also known as the Law of Inertia) states that an object will remain at rest, or in uniform motion in a straight line, unless acted upon by a net external force.",
             "Step 5: Explain the relationship between Inertia and Newton's First Law. Newton's First Law is essentially a formal statement of the concept of inertia. It tells us that objects don't change their motion spontaneously; a force is required. Inertia is the property of matter that Newton's First Law describes. The law quantifies that an object's velocity (which includes speed and direction) remains constant if and only if the net force acting on it is zero.",
             "Step 6: Elaborate on 'unbalanced force'. An unbalanced or net external force is a force that is not countered by another force, leading to a change in the object's motion (i.e., acceleration). If forces are balanced, the net force is zero, and the object's state of motion doesn't change, as per the law of inertia.",
             "Key Takeaway: Inertia is an object's resistance to changes in its motion, quantified by its mass. Newton's First Law formalizes this by stating that an object's velocity remains constant unless a net external force acts on it."
           ]
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
      const systemPrompt = "You are an expert IB science teacher specializing in Chemistry, Physics, and Biology with 20+ years of experience teaching IB DP students. Your expertise includes creating educational content that follows IB curriculum standards and assessment criteria. Your explanations are known for being exceptionally clear, methodical, and step-by-step, helping students truly understand complex scientific concepts rather than just memorizing facts. You excel at breaking down difficult topics into logical steps and explaining WHY scientific principles work the way they do, not just WHAT they are. You always use proper mathematical notation and ensure your explanations connect to the broader scientific context. Your goal is to create quiz questions that not only test knowledge but also serve as effective learning tools through their detailed, structured explanations.\\n\\nCrucially, all generated content, including question topics, difficulty, terminology, and explanations, must be strictly and explicitly aligned with the International Baccalaureate (IB) curriculum for the specified subject and level (e.g., IB Physics HL, IB Chemistry SL).\\n\\nCRITICAL FORMATTING REQUIREMENTS:\\n1. Always use proper LaTeX notation for ALL mathematical formulas, equations, and expressions.\\n2. ALWAYS use braces for subscripts and superscripts: $v_{0}$ not $v_0$, $a_{x}$ not $a_x$, $10^{-3}$ not $10^-3$.\\n3. ALWAYS use proper LaTeX commands for functions: $\\cos(\\theta)$ not $cos(\\theta)$, $\\sin(\\theta)$ not $sin(\\theta)$.\\n4. ALWAYS use proper LaTeX commands for Greek letters: $\\theta$ not $theta$, $\\alpha$ not $alpha$.\\n5. For degrees, use $30^{\\circ}$ not $30\\circ$ or $30^\\circ$.\\n6. ALWAYS separate angle measurements from variables with a space or multiplication symbol: $45^{\\circ} \\cdot v_{0}$ not $45^{\\circ}v_{0}$.\\n7. ALWAYS use \\text{} for text within math: $v_{\\text{total}}$ not $v_{total}$.\\n8. NEVER place exponents directly next to variables with subscripts without proper spacing.\\n9. Format explanations in a clear, step-by-step manner with proper headings and structure.\\n\\nCRITICAL FOR PHYSICS FORMULAS:\\n1. For angles with velocity: ALWAYS separate angle and variable with a space: $45^{\\circ} \\cdot v_{0}$ not $45^{\\circ}v_{0}$\\n2. For equations with exponents: ALWAYS use braces: $20^{0}$ not $20^0$\\n3. For double exponents (like degrees with variables): ALWAYS use proper spacing: $45^{\\circ} \\cdot v_{0}^{2}$ not $45^{\\circ}v_{0}^{2}$\\n4. For fractions with variables: ALWAYS use braces: $\\frac{1}{2}g(v_{\\text{total}})^{2}$ not $\\frac{1}{2}g(v_total)^2$\\n5. ALWAYS use braces for ALL subscripts and superscripts without exception\\n6. ALWAYS use \\text{} for text within math: $v_{\\text{total}}$ not $v_{total}$\\n7. NEVER place exponents directly next to variables with subscripts without proper spacing\\n\\nWhen provided with additional context about a topic, use this information to create more accurate, detailed, and curriculum-aligned questions. Incorporate specific facts, concepts, and terminology from the provided context, but adapt them to create appropriate questions rather than copying directly. Ensure all information used is scientifically accurate and relevant to the IB curriculum.";

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
        title: "IB Science Quiz Generator"
      });

      // Parse the response
      let data;
      try {
        data = response.json();
      } catch (parseError) {
        console.error("Error parsing response JSON:", parseError);
        data = { choices: [{ message: { content: response.text } }] };
      }
      console.log("API Response:", JSON.stringify(data, null, 2));

      try {
        let parsedContent;

        // Check if we have data from the response
        if (data && typeof data === 'object') {
          try {
            // If data already has a questions array, use it directly
            if (data.questions && Array.isArray(data.questions)) {
              parsedContent = data;
              console.log("Found questions array directly in response");
            }
            // If data has choices (OpenRouter format)
            else if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
              // Clean the content by removing markdown code blocks if present
              let content = data.choices[0].message.content;

              // Remove markdown code blocks if present (```json ... ```)
              if (content.startsWith("```") && content.endsWith("```")) {
                // Extract the content between the first ``` and the last ```
                content = content.substring(content.indexOf('\\n') + 1, content.lastIndexOf('```')).trim();
              }

              console.log("Cleaned content:", content.substring(0, 100) + "...");

              // Fix escaped backslashes in LaTeX before parsing JSON
              // This is a common issue with LaTeX in JSON
              try {
                // First attempt: Try to parse as is
                parsedContent = JSON.parse(content);
              } catch (initialParseError) {
                console.log("Initial parse failed, attempting to fix LaTeX backslashes");

                try {
                  // Second attempt: Try to fix common LaTeX escaping issues and control characters
                  // Replace \\ with a temporary placeholder
                  let fixedContent = content.replace(/\\\\/g, "DOUBLE_BACKSLASH_PLACEHOLDER");

                  // Replace single backslashes that are likely part of LaTeX with double backslashes
                  fixedContent = fixedContent.replace(/\\([a-zA-Z]+|[^a-zA-Z])/g, "\\\\$1");

                  // Restore original double backslashes
                  fixedContent = fixedContent.replace(/DOUBLE_BACKSLASH_PLACEHOLDER/g, "\\\\");

                  // Remove control characters that can break JSON parsing
                  fixedContent = fixedContent.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");

                  console.log("Attempting to parse fixed content");
                  parsedContent = JSON.parse(fixedContent);
                } catch (fixedParseError) {
                  console.error("Fixed parse also failed:", fixedParseError);

                  // Third attempt: Manual JSON parsing as a last resort
                  try {
                    console.log("Attempting manual extraction of questions");

                    // Extract questions array using regex
                    const questionsMatch = content.match(/"questions"\\s*:\\s*\\\[([\\s\\S]*?)\\\]\\s*\\}/);

                    if (questionsMatch && questionsMatch[1]) {
                      const questionsContent = questionsMatch[1];

                      // Split by question objects
                      const questionObjects = questionsContent.split(/\\},\\s*\\{/).map((q: string, i: number) => {
                        // Add back the curly braces except for first and last
                        if (i === 0) return q + '}';
                        if (i === questionsContent.split(/\\},\\s*\\{/).length - 1) return '{' + q;
                        return '{' + q + '}';
                      });

                      // Parse each question individually
                      const questions = [];
                      for (const qObj of questionObjects) {
                        try {
                          // Extract fields using regex
                          const typeMatch = qObj.match(/"type"\\s*:\\s*"([^"]+)"/);
                          const questionMatch = qObj.match(/"question"\\s*:\\s*"([^"]+)"/);
                          const correctAnswerMatch = qObj.match(/"correctAnswer"\\s*:\\s*"([^"]+)"/);
                          const explanationMatch = qObj.match(/"explanation"\\s*:\\s*"([^"]+)"/);

                          // For multiple choice, extract options
                          const optionsMatch = qObj.match(/"options"\\s*:\\s*\\\[([\\s\\S]*?)\\\]/);
                          let options = [];

                          if (optionsMatch && optionsMatch[1]) {
                            options = optionsMatch[1].split(/",\\s*"/).map((opt: string) => {
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
                          } = {
                            type: typeMatch ? typeMatch[1] : "unknown",
                            question: questionMatch ? questionMatch[1].replace(/\\\\"/g, '"') : "Unknown question",
                            correctAnswer: correctAnswerMatch ? correctAnswerMatch[1] : "",
                            explanation: explanationMatch ? explanationMatch[1].replace(/\\\\"/g, '"') : ""
                          };

                          if (options.length > 0) {
                            question.options = options;
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
                    } else {
                      throw new Error("Could not find questions array");
                    }
                  } catch (manualError) {
                    console.error("Manual extraction failed:", manualError);
                    throw initialParseError; // Throw the original error
                  }
                }
              }
            } else {
              // If we can't find a standard structure, check if the response itself is the content
              console.log("Non-standard response structure, checking if response is directly usable");

              if (typeof response.text === 'string' && response.text.includes('"questions"')) {
                try {
                  // Try to parse the text directly
                  const directContent = response.text;

                  // Check for JSON in markdown
                  const jsonMatch = directContent.match(/```json\\n([\\s\\S]*?)\\n```/) ||
                                   directContent.match(/```\\n([\\s\\S]*?)\\n```/) ||
                                   directContent.match(/\\{[\\s\\S]*\\}/);

                  if (jsonMatch) {
                    let extractedJson = jsonMatch[1] || jsonMatch[0];

                    // Apply the same LaTeX escaping fixes as above
                    console.log("Fixing LaTeX escaping in direct response");

                    // First, remove control characters that can break JSON parsing
                    extractedJson = extractedJson.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");

                    try {
                      // First attempt: Try to parse as is
                      parsedContent = JSON.parse(extractedJson);
                      console.log("Extracted content directly from response text");
                    } catch (initialDirectParseError) {
                      console.log("Initial direct parse failed, attempting to fix LaTeX backslashes");

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
                      } catch (fixedDirectParseError) {
                        console.error("Fixed direct parse also failed:", fixedDirectParseError);

                        // Third attempt: Try more aggressive fixing
                        try {
                          // More aggressive approach: replace all backslashes with double backslashes
                          let aggressiveFixedJson = extractedJson.replace(/\\/g, "\\\\");

                          // Fix double escaped quotes
                          aggressiveFixedJson = aggressiveFixedJson.replace(/\\\\\\"/g, '\\"');

                          console.log("Attempting aggressive JSON fixing");
                          parsedContent = JSON.parse(aggressiveFixedJson);
                          console.log("Successfully parsed with aggressive fixing");
                        } catch (aggressiveFixError) {
                          console.error("Aggressive fix also failed:", aggressiveFixError);
                          throw new Error("Failed to parse direct response after multiple attempts");
                        }
                      }
                    }
                  } else {
                    throw new Error("Could not extract JSON from response text");
                  }
                } catch (directParseError) {
                  console.error("Direct parse failed:", directParseError);

                  // Try one more approach: manual regex extraction of questions
                  try {
                    console.log("Attempting manual extraction from direct response");

                    // Extract questions array using regex
                    const questionsMatch = response.text.match(/"questions"\\s*:\\s*\\\[([\\s\\S]*?)\\\]\\s*\\}/);

                    if (questionsMatch && questionsMatch[1]) {
                      const questionsContent = questionsMatch[1];

                      // Split by question objects
                      const questionObjects = questionsContent.split(/\\},\\s*\\{/).map((q: string, i: number) => {
                        // Add back the curly braces except for first and last
                        if (i === 0) return q + '}';
                        if (i === questionsContent.split(/\\},\\s*\\{/).length - 1) return '{' + q;
                        return '{' + q + '}';
                      });

                      // Parse each question individually
                      const questions = [];
                      for (const qObj of questionObjects) {
                        try {
                          // Extract fields using regex
                          const typeMatch = qObj.match(/"type"\\s*:\\s*"([^"]+)"/);
                          const questionMatch = qObj.match(/"question"\\s*:\\s*"([^"]+)"/);
                          const correctAnswerMatch = qObj.match(/"correctAnswer"\\s*:\\s*"([^"]+)"/);
                          const explanationMatch = qObj.match(/"explanation"\\s*:\\s*"([^"]+)"/);

                          // For multiple choice, extract options
                          const optionsMatch = qObj.match(/"options"\\s*:\\s*\\\[([\\s\\S]*?)\\\]/);
                          let options: string[] = [];

                          if (optionsMatch && optionsMatch[1]) {
                            options = optionsMatch[1].split(/",\\s*"/).map((opt: string) => {
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
                            question: questionMatch ? questionMatch[1].replace(/\\\\"/g, '"') : "Unknown question",
                            correctAnswer: correctAnswerMatch ? correctAnswerMatch[1].replace(/\\\\"/g, '"') : "",
                            explanation: explanationMatch ? explanationMatch[1].replace(/\\\\"/g, '"') : ""
                          };

                          if (options.length > 0) {
                            question.options = options;
                          }

                          // For problem-solving, extract steps
                          const stepsMatch = qObj.match(/"steps"\\s*:\\s*\\\[([\\s\\S]*?)\\\]/);
                          if (stepsMatch && stepsMatch[1]) {
                            const steps = stepsMatch[1].split(/",\\s*"/).map((step: string) => {
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
                        console.log("Successfully extracted questions manually");
                      } else {
                        throw new Error("Failed to extract any questions");
                      }
                    } else {
                      throw new Error("Could not find questions array in direct response");
                    }
                  } catch (manualExtractionError) {
                    console.error("Manual extraction from direct response failed:", manualExtractionError);
                    throw new Error("Failed to parse response in any format");
                  }
                }
              } else {
                console.error("Unexpected API response structure:", data);
                throw new Error("Unexpected API response structure");
              }
            }
          } catch (parseError) {
            console.error("Error parsing message content:", parseError);
            throw new Error("Failed to parse message content");
          }
        } else {
          console.error("Empty or invalid API response:", data);
          throw new Error("Empty or invalid API response");
        }

        // Check if questions array exists
        if (!parsedContent.questions || !Array.isArray(parsedContent.questions)) {
          console.error("Invalid response format:", parsedContent);

          // Fall back to mock questions if response format is invalid
          const mockQuestions = generateMockQuestions(
            validatedParams.topic,
            validatedParams.subject,
            validatedParams.count,
            validatedParams.difficulty,
            validatedParams.questionTypes
          );

          return NextResponse.json({
            questions: mockQuestions,
            generationId: `mock-${Date.now()}`,
            note: "Using mock data due to invalid response format"
          });
        }

        // Process the questions
        const questions = parsedContent.questions.map((q: any, index: number) => ({
          ...q,
          id: `q-${index}`, // Using a simpler ID for now based on the current file content
          hints: q.hints || [], // Ensure hints is an array, default to empty if not provided
        }));

        // Get the generation ID from the response or data
        const generationId = (response as any).id || data.id;

        return NextResponse.json({
          questions,
          generationId
        });
      } catch (error) {
        console.error("Error parsing API response:", error);

        // Fall back to mock questions if parsing fails
        const mockQuestions = generateMockQuestions(
          validatedParams.topic,
          validatedParams.subject,
          validatedParams.count,
          validatedParams.difficulty,
          validatedParams.questionTypes
        );

        return NextResponse.json({
          questions: mockQuestions,
          generationId: `mock-${Date.now()}`,
          note: "Using mock data due to parsing error"
        });
      }
    } catch (apiError) {
      console.error("API call error:", apiError);

      // Fall back to mock questions if API call fails
      const mockQuestions = generateMockQuestions(
        validatedParams.topic,
        validatedParams.subject,
        validatedParams.count,
        validatedParams.difficulty,
        validatedParams.questionTypes
      );

      return NextResponse.json({
        questions: mockQuestions,
        generationId: `mock-${Date.now()}`,
        note: "Using mock data due to API call error"
      });
    }
  } catch (validationError) {
    if (validationError instanceof z.ZodError) {
      return NextResponse.json({ error: validationError.errors }, { status: 400 });
    }
    console.error("Unexpected error:", validationError);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


// Mock data generation function (remains unchanged)
function generateMockQuestions(
  topic: string,
  subject: string,
  count: number,
  difficulty: string,
  questionTypes: string[]
) {
  const mocks = [];
  for (let i = 0; i < count; i++) {
    const type = questionTypes[i % questionTypes.length];
    let question: any = {
      id: `mock-${topic}-${i + 1}`,
      type: type,
      question: `Mock ${type} question ${i + 1} about ${topic} (${difficulty} ${subject})`,
      explanation: `Mock explanation for question ${i + 1}. This is where a detailed step-by-step explanation would go, including LaTeX formulas like $E=mc^2$.`,
      hints: [
        `Mock Hint 1 for question ${i+1}`,
        `Mock Hint 2 for question ${i+1}`,
        `Mock Hint 3 for question ${i+1}`,
        `Mock Hint 4 for question ${i+1}`,
        `Mock Hint 5 for question ${i+1}`
      ]
    };

    if (type === "multiple-choice") {
      question = {
        ...question,
        options: ["Mock Option A", "Mock Option B", "Mock Option C", "Mock Option D"],
        correctAnswer: "A",
      };
    } else if (type === "definition") {
      question = {
        ...question,
        correctAnswer: `Mock definition for term in question ${i + 1}.`,
      };
    } else if (type === "problem-solving") {
      question = {
        ...question,
        correctAnswer: `Mock solution to problem in question ${i + 1}.`,
        steps: [
          "Mock Step 1: Identify formula $a^2+b^2=c^2$",
          "Mock Step 2: Substitute values",
          "Mock Step 3: Calculate result",
        ],
      };
    }
    mocks.push(question);
  }
  return mocks;
}
