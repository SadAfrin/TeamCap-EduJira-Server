import { Router } from "express";
import { generateQuiz, getStudentQuizHistory, saveQuizAttempt } from "../controllers/quiz.controller";
// If you want to require users to be logged in to take quizzes, import verifyAuth here
// import { verifyAuth } from "../middleware/auth.middleware"; 

const router = Router();

// Route to generate the AI questions: POST /api/quizzes/generate
router.post("/generate", generateQuiz);

// Route to save the student's score: POST /api/quizzes/save
router.post("/save", saveQuizAttempt); 

router.get("/history/:studentId", getStudentQuizHistory);

export default router;