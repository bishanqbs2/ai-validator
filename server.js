import express from "express";
import OpenAI from "openai";
import path from "path";

const app = express();
app.use(express.json());

// Serve SPA frontend
app.use(express.static(path.join(process.cwd(), "public")));

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // MUST be set in Render
});

// Example question (can be extended)
const QUESTION = "What is the capital of France?";
const CORRECT_ANSWER = "Paris";

// AI validation function
async function validateAnswer(userAnswer) {
  const prompt = `
You are an AI answer validation system.

Question:
"${QUESTION}"

Expected answer:
"${CORRECT_ANSWER}"

User answer:
"${userAnswer}"

Check correctness based on meaning, not exact words.
Reply ONLY in JSON:
{
  "isCorrect": true | false,
  "confidence": number between 0 and 1,
  "feedback": "short explanation"
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0
  });

  return JSON.parse(response.choices[0].message.content);
}

// API endpoint
app.post("/validate", async (req, res) => {
  try {
    const { answer } = req.body;
    if (!answer) return res.status(400).json({ error: "Answer is required" });

    const result = await validateAnswer(answer);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI validation failed" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
