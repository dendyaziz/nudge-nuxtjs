import { defineEventHandler, readBody, createError, sendError } from 'h3';
import axios from 'axios';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { refineInstruction, softenData } = body;

  if (!refineInstruction || !softenData) {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: 'Missing refineInstruction or softenData'
    }));
  }

  // --- Input Validation ---
  const lower = refineInstruction.toLowerCase();
  const marketingWords = ['buy', 'sale', 'discount', 'promo', 'subscribe'];
  const sexualWords = ['sex', 'nude', 'nsfw', 'porn'];
  if (marketingWords.some((w) => lower.includes(w))) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Marketing content is not allowed' }));
  }
  if (sexualWords.some((w) => lower.includes(w))) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Sexual content is not allowed' }));
  }

  // --- Use your runtime config ---
  const config = useRuntimeConfig();
  const apiKey = config.geminiApiKey;
  if (!apiKey) {
    console.error("API Key not configured");
    return sendError(event, createError({ statusCode: 500, statusMessage: 'Server configuration error: API Key missing' }));
  }

  // Use the correct API endpoint for Gemini Flash
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  const prompt = `# Prompt: Refine Gentle Message (Structured JSON Output)

You are an expert communicator skilled in refining indirect, third-person messages for highly sensitive situations. Your task is to take an already softened message and refine it according to specific instructions, while maintaining its gentle and non-offensive nature.

---

## Instructions:

1. **Analyze**: Read the \`Original Softened Message\` and \`Original Suggestion\`. Understand their tone and purpose.
2. **Apply Refinement**: Apply the \`Refinement Instructions\` to modify the message and suggestion while maintaining the gentle, non-offensive tone.
3. **Generate \`soften_message\`**:
   * Refine the original softened message according to the instructions.
   * Maintain the indirect, third-person approach.
   * Keep the message gentle and non-offensive.
   * Use \`\\n\` for line breaks where it improves readability for a messaging app.
4. **Generate \`suggestion\`**:
   * Refine the original suggestion according to the instructions if any, or add a new one if the user put some suggestion on refinement instruction.
   * If the refinement instructions specifically ask to remove or not include a suggestion, make this field an empty string (\`""\`).
   * Keep it brief, high-level, non-judgmental, gentle and not offensive. No detailed steps. But make sure it is a complete sentence containing 10-20 words and not just "Take a bath".
5. **Format Output**: Structure the final output *strictly* as a valid JSON object string with the exact keys \`soften_message\` and \`suggestion\`, containing the texts generated in the previous steps. Ensure the JSON syntax is correct (e.g., proper quotes, commas).
6. **Safety**: Do not include any harmful, offensive, marketing, or sexual content in the *output fields*.

---

## Input Fields:

Original Softened Message: \${softenMessage}
Original Suggestion: \${suggestion}
Refinement Instructions: \${refineInstruction}

---

## Expected Output Format (Must be a valid JSON string):

\`\`\`json
{
  "soften_message": "[Refined gentle message text, using \\\\n for line breaks]",
  "suggestion": "[Refined brief suggestion, or empty string \\"\\" if instructed to remove suggestion]"
}
\`\`\`
`; // End of prompt string

  // Ensure placeholders are correctly replaced.
  const finalPrompt = prompt
    .replace('${softenMessage}', softenData.soften_message)
    .replace('${suggestion}', softenData.suggestion)
    .replace('${refineInstruction}', refineInstruction);

  try {
    const response = await axios.post(url, {
      contents: [
        { role: 'user', parts: [{ text: finalPrompt }] },
        // Add a model role instruction to ensure JSON output
        { role: 'model', parts: [{ text: '```json\n' }] } // Guide the model to start with JSON
      ],
      generationConfig: {
        temperature: 0.7, // Adjusted slightly for more consistent JSON output
        // Ensure the model outputs JSON
        responseMimeType: "application/json", // ** Crucial for Gemini JSON mode **
      }
    });

    // --- Parse JSON Output ---
    const candidate = response.data.candidates?.[0];
    if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
      console.error("Invalid API response structure:", response.data);
      return sendError(event, createError({ statusCode: 500, statusMessage: 'AI API error: Unexpected response structure' }));
    }

    let jsonString = candidate.content.parts[0].text;

    console.log(jsonString)

    // Clean potential markdown ```json ... ``` fences if responseMimeType didn't enforce perfectly
    jsonString = jsonString.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');

    try {
      const result = JSON.parse(jsonString);

      // Validate the structure of the parsed object
      if (typeof result.soften_message !== 'string' ||
        typeof result.suggestion !== 'string') {
        console.error("Parsed JSON has incorrect structure:", result);
        return sendError(event, createError({ statusCode: 500, statusMessage: 'AI API error: Incorrect JSON structure received' }));
      }

      // Return the structured object
      return {
        data: {
          soften_message: result.soften_message,
          suggestion: result.suggestion
        },
        statusCode: 200,
        statusMessage: 'Success'
      };

    } catch (parseError: any) {
      console.error("Failed to parse JSON response from AI:", jsonString, parseError);
      return sendError(event, createError({ statusCode: 500, statusMessage: 'AI API error: Failed to parse response JSON', data: parseError.message }));
    }

  } catch (err: any) {
    console.error("Error calling AI API:", err.response?.data || err.message);
    return sendError(event, createError({ statusCode: 500, statusMessage: 'AI API error', data: err.response?.data || err.message }));
  }
});
