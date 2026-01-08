import express from "express";
import OpenAI from "openai";
import cors from "cors";
import path from "path";

const app = express();
app.use(express.json());

// Enable CORS for all origins (can restrict later)
app.use(cors());

// Serve SPA frontend
app.use(express.static(path.join(process.cwd(), "public")));

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // MUST be set in Render
});

// Quiz questions
const QUESTIONS = [
  { question: "What is the capital of France?", answer: "Paris" },
  { question: "What is 5 + 7?", answer: "12" },
  { question: "Who wrote 'Romeo and Juliet'?", answer: "Shakespeare" }
];

// API endpoint for validation
app.post("/validate", async (req, res) => {
  try {
    const { answer, questionIndex } = req.body;

    if (!answer || questionIndex === undefined) {
      return res.status(400).json({ error: "Answer and questionIndex are required" });
    }

    const q = QUESTIONS[questionIndex];
    if (!q) {
      return res.status(400).json({ error: "Invalid question index" });
    }

    const prompt = `
You are an AI answer validation system.
Question: "${q.question}"
Expected answer: "${q.answer}"
User answer: "${answer}"
Reply ONLY in JSON:
{ "isCorrect": true|false, "confidence": 0-1, "feedback": "short explanation" }
`;

    let result = { isCorrect: false, confidence: 0, feedback: "Unknown error" };

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0
      });

      // Safely parse AI output
      const content = response.choices[0].message.content;
      try {
        result = JSON.parse(content);
      } catch (err) {
        console.warn("Invalid JSON from AI, returning fallback", content);
        result = { isCorrect: false, confidence: 0, feedback: content };
      }

    } catch (err) {
      console.error("OpenAI API error:", err);
      result = { isCorrect: false, confidence: 0, feedback: "OpenAI API failed" };
    }

    res.json(result);

  } catch (err) {
    console.error("Backend error:", err);
    res.status(500).json({ error: "AI validation failed" });
  }
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

