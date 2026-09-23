import mongoose, { Schema, Document } from "mongoose";

export interface IQuizAttempt extends Document {
  studentId: string;
  topic: string;
  score: number;
  totalQuestions: number;
  qaData: {
    question: string;
    options: string[];
    correctAnswer: string;
    studentAnswer: string;
    isCorrect: boolean;
  }[];
}

const QuizAttemptSchema = new Schema({
  studentId: { type: String, required: true },
  topic: { type: String, required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, default: 10 },
  qaData: [{
    question: String,
    options: [String],
    correctAnswer: String,
    studentAnswer: String,
    isCorrect: Boolean
  }]
}, { timestamps: true });

export default mongoose.model<IQuizAttempt>("QuizAttempt", QuizAttemptSchema);