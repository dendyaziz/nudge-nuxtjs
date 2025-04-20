import { defineEventHandler, readBody, createError, sendError } from 'h3';
import axios from 'axios';
// Assuming useRuntimeConfig is correctly set up elsewhere in your Nuxt/Nitro project
// import { useRuntimeConfig } from '#imports'; // Or appropriate import path

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { message, fullName } = body;

  if (!message || !fullName) {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: 'Missing message, fullName'
    }));
  }

  // --- Input Validation (Keep as is) ---
  const lower = message.toLowerCase();
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

  const prompt = `# Prompt: Gentle Sensitive Message Generator (Structured JSON Output)

You are an expert communicator skilled in crafting indirect, third-person messages for highly sensitive situations. Your task is to take a potentially blunt, harsh, or offensive message, analyze it, and generate a structured JSON output containing a softened version, a brief suggestion (if applicable), and a disclaimer, all in the specified language and suitable for messaging apps like WhatsApp (using '\\n' for line breaks).

---

## Instructions:

1.  **Analyze**: Read the \`Original Message\`. Identify the core sensitive concern (e.g., body odor, appearance, behavior) and its nuance. Note the \`Recipient Full Name\`.
2.  **Determine Language**: Identify the \`Output Language\`. **All** text generated for the JSON fields **must** be in this language.
3.  **Generate \`soften_message\`**:
    *   Craft the main gentle message based on the analysis.
    *   Do not need to mention the Recipient's name.
    *   Use friendly term as an alternative to "you" in language like Indonesian, Spanish, etc. (e.g., "Kamu").
    *   Do not explicitly mention that the sender want to say something "gently" as a part of the message, because it is not natural.
    *   Start indirectly: "Someone who knows you wanted to gently let you know about a possibility regarding..." (or similar culturally appropriate opening in the \`Output Language\`).
    *   State the issue *very* gently and indirectly in the \`Output Language\` (e.g., "a potential matter related to personal scent," "a possible hygiene concern"). Avoid blunt terms.
    *   Do NOT include any suggestions or recommendations in the softened message.
    *   Use \`\\n\` for line breaks where it improves readability for a messaging app.
4.  **Generate \`suggestion\`**:
    *   **If** the analysis suggests a solvable problem (like body odor, hygiene habits), generate a *very short* (1 sentence max), gentle, actionable suggestion in the \`Output Language\`.
    *   **If** the original message contains specific suggestions, incorporate these into your response while rephrasing them to be gentler if needed.
    *   **If** no clear suggestion is appropriate or possible, or if the original message is just an insult with no implied problem, make this field an empty string (\`""\`).
    *   Keep it brief, high-level, non-judgmental, gentle and not offensive. No detailed steps. But make sure it is a complete sentence containing 10-20 words and not just "Take a bath".
5.  **Generate \`disclaimer\`**:
    *   Combine the following two points into a single string, do not separate by a line break, translated into the \`Output Language\`:
        *   "This message is intended for [Recipient Full Name]."
        *   "If this message has reached the wrong person, please disregard it entirely."
6.  **Format Output**: Structure the final output *strictly* as a valid JSON object string with the exact keys \`soften_message\`, \`suggestion\`, and \`disclaimer\`, containing the texts generated in the previous steps. Ensure the JSON syntax is correct (e.g., proper quotes, commas).
7.  **Safety**: Do not include any harmful, offensive, marketing, or sexual content in the *output fields*.

---

## Input Fields:

Recipient Full Name: \${fullName}
Original Message: \${message}
Output Language: The language used in the "Original Message" // e.g., "Indonesian", "English", "Spanish"

---

## Expected Output Format (Must be a valid JSON string):

\`\`\`json
{
  "soften_message": "[Generated gentle message text in Output Language, using \\\\n for line breaks]",
  "suggestion": "[Generated brief suggestion in Output Language, or empty string \\"\\", using \\\\n if needed]",
  "disclaimer": "[Combined 'intended for' and 'wrong person' text in Output Language, separated by \\\\n]"
}
\`\`\`
`; // End of prompt string

  // Ensure placeholders are correctly replaced.
  const finalPrompt = prompt
    .replace('${fullName}', fullName)
    .replace('${message}', message); // Pass the language

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
        // candidateCount: 1 // Usually defaults to 1
      }
    });

    // --- MODIFIED: Expect and Parse JSON Output ---
    const candidate = response.data.candidates?.[0];
    if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
      console.error("Invalid API response structure:", response.data);
      return sendError(event, createError({ statusCode: 500, statusMessage: 'AI API error: Unexpected response structure' }));
    }

    let jsonString = candidate.content.parts[0].text;

    // Clean potential markdown ```json ... ``` fences if responseMimeType didn't enforce perfectly
    jsonString = jsonString.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');

    try {
      const result = JSON.parse(jsonString);

      // Validate the structure of the parsed object
      if (typeof result.soften_message !== 'string' ||
        typeof result.suggestion !== 'string' ||
        typeof result.disclaimer !== 'string') {
        console.error("Parsed JSON has incorrect structure:", result);
        return sendError(event, createError({ statusCode: 500, statusMessage: 'AI API error: Incorrect JSON structure received' }));
      }

      // Return the structured object
      return {
        data: {
          soften_message: result.soften_message,
          suggestion: result.suggestion,
          disclaimer: result.disclaimer
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
