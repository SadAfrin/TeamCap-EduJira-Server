import { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import QuizAttempt from "../models/QuizAttempt.model";

// Initialize Gemini (Make sure GEMINI_API_KEY is in your .env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export const generateQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const { topic } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    // The Prompt Engine: Forcing JSON output is critical here
    const prompt = `Generate a 10-question multiple choice quiz about "${topic}". 
    Return ONLY a raw JSON array of objects. Do not use markdown formatting or code blocks.
    Each object must exactly match this structure:
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "The exact string of the correct option"
    }`;

    const result = await model.generateContent(prompt);
    let rawText = result.response.text();
    
    // Safety cleanup in case the AI wraps the response in ```json
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("AI did not return a valid JSON array");
    }
    
    const questions = JSON.parse(jsonMatch[0]);
    res.status(200).json({ success: true, data: questions });
  } catch (error) {
    console.error("AI Quiz Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate quiz." });
  }
};

// Route to save the final graded attempt
export const saveQuizAttempt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, topic, qaData, score } = req.body;
    const newAttempt = await QuizAttempt.create({ studentId, topic, qaData, score });
    res.status(201).json({ success: true, data: newAttempt });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to save quiz attempt." });
  }
};

export const getStudentQuizHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    
    // Fetch all attempts for this student, sorted by newest first
    const history = await QuizAttempt.find({ studentId }).sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ success: false, message: "Failed to fetch quiz history." });
  }
};