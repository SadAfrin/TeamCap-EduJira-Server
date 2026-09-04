import express, { Application, Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { corsMiddleware } from "./config/cors";
import connectDB from "./config/db";

import studentRoutes from "./routes/student.routes";
import teacherRoutes from "./routes/teacher.routes";
import adminRoutes from "./routes/admin.routes";
import parentRoutes from "./routes/parent.routes";
import classRoutes from "./routes/class.routes";
import subjectRoutes from "./routes/subject.routes";
import attendanceRoutes from "./routes/attendance.routes";
import statsRoutes from "./routes/stats.routes";
import eventRoutes from "./routes/event.routes";
import timetableRoutes from "./routes/timetable.routes";
import leaveRoutes from "./routes/leave.routes";
import messageRoutes from "./routes/message.routes";
import uploadRoutes from "./routes/upload.routes";

const app: Application = express();

// Connect DB (handles serverless execution like Vercel)
connectDB();

// Middlewares
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Root / Health Check endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "EduJira API Server is running successfully!",
    version: "1.0.0",
    endpoints: [
      "/api/students",
      "/api/teachers",
      "/api/admins",
      "/api/parents",
      "/api/classes",
      "/api/subjects",
      "/api/attendance",
      "/api/stats/overview",
      "/api/calendar",
      "/api/events",
      "/api/timetable",
      "/api/leave",
      "/api/messages",
      "/api/upload",
    ],
  });
});

// API Routes
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/parents", parentRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/calendar", eventRoutes);
app.use("/api/events", eventRoutes); // Convenient alias
app.use("/api/timetable", timetableRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);

// Handle 404 Route Not Found
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled Error:", err);

  if (err.name === "ValidationError") {
    res.status(400).json({
      success: false,
      message: "Database validation failed",
      errors: Object.values(err.errors || {}).map((e: any) => e.message),
    });
    return;
  }

  if (err.name === "CastError") {
    res.status(400).json({
      success: false,
      message: `Invalid ID format for path: ${err.path}`,
    });
    return;
  }

  if (err.code === 11000) {
    res.status(400).json({
      success: false,
      message: "Duplicate key error: value already exists in database",
      keyValue: err.keyValue,
    });
    return;
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;
