import express from "express";
import { corsMiddleware } from "./config/cors";
import attendanceRoutes from "./routes/attendance.routes";
import studentRoutes from "./routes/student.routes";
import connectDB from "./config/db";

const app = express();

// Ensure DB connects when this module loads (works for both local + Vercel)
connectDB();

app.use(corsMiddleware);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "EduJira Server is running successfully!",
  });
});

app.use("/api/attendance", attendanceRoutes);
app.use("/api/students", studentRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;