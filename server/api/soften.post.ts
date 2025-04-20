import { defineEventHandler, readBody, createError, sendError } from 'h3';
import axios from 'axios';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { message, fullName } = body;
  if (!message || !fullName) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Missing message or fullName' }));
  }

  const lower = message.toLowerCase();
  const marketingWords = ['buy', 'sale', 'discount', 'promo', 'subscribe'];
  const sexualWords = ['sex', 'nude', 'nsfw', 'porn'];
  if (marketingWords.some((w) => lower.includes(w))) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Marketing content is not allowed' }));
  }
  if (sexualWords.some((w) => lower.includes(w))) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Sexual content is not allowed' }));
  }

  const config = useRuntimeConfig();
  const apiKey = config.geminiApiKey;
  // Use a supported chat model (e.g., Google Generative Language API chat-bison-001)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${apiKey}`;
  const prompt = `# Prompt: Gentle Third-Person Sensitive Message Generator (Specific Language & Structure)

You are an expert communicator skilled in crafting indirect, third-person messages for highly sensitive situations. Your task is to take a potentially blunt, harsh, or offensive message about a sensitive personal issue and transform it into a very gentle, indirect, third-person notification, suitable for delivery via text or anonymous message, **strictly adhering to the specified output language**.

---

## Instructions:

1.  **Analyze**: Read the \`Original Message\` provided below. Identify the core sensitive concern (e.g., body odor, appearance issue, behavioral feedback). Understand its **nuance** (e.g., is it mild, strong, specific?).
2.  **Identify Recipient**: Note the \`Recipient Full Name\`.
3.  **Determine Language**: Note the explicitly provided \`Output Language\`. **All** generated text in the final output **must** be in this language.
4.  **Craft Message**: Construct the message *exactly* following this structure and using the specified \`Output Language\`:
    *   **Start with the topic**: Begin with a phrase like "Someone who knows you wanted to gently let you know about a possibility regarding..." or a similar culturally appropriate opening in the target language.
    *   **State the issue gently**: Based on your analysis (Step 1), state the issue *very* indirectly and gently, reflecting the nuance if possible. **Do not simply copy the examples below.** *Adapt* phrasing like "a potential matter related to personal scent," "a possible hygiene concern," or "an observation regarding underarm freshness" into the \`Output Language\`. Avoid blunt terms.
    *   **Mention the recipient**: Follow with "This message is intended for [Recipient Full Name]." (Translate "This message is intended for" into the \`Output Language\`).
    *   **Include disclaimer**: Add "If this message has reached the wrong person, please disregard it entirely." (Translate this disclaimer into the \`Output Language\`).
5.  **Output Only**: Ensure the output contains ONLY the rephrased message in the specified third-person format and \`Output Language\`. No extra text, formatting, or explanations.
6.  **Safety**: Do not include any harmful, offensive, marketing, or sexual content in the *output*.

---

## Input Fields:

Recipient Full Name: ${fullName}
Original Message: ${message}
Output Language: The language used on Original Message // e.g., "Indonesian", "English", "Spanish"

---

## Expected Output Format:

[Generated message in the specified Output Language, following the structure in Instruction 4]
`;

  try {
    const response = await axios.post(url, {
      // Use chat-style prompt as required by the generateMessage endpoint
      contents: [
        { role: 'user', parts: [{ text: prompt }] },
      ],
      generationConfig: {
        temperature: 0.8,
        // candidateCount defaults to 1 if omitted, but can be specified
        candidateCount: 1
      }
    });

    // Extract the softened text from the chat candidate message
    const softened = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { softened };
  } catch (err: any) {
    return sendError(event, createError({ statusCode: 500, statusMessage: 'AI API error', data: err.response?.data || err.message }));
  }
});
