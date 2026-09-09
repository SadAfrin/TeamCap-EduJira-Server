import express, { Application, Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { corsMiddleware } from "./config/cors";
import connectDB from "./config/db";

import studentRoutes from "./routes/student.routes";
import teacherRoutes from "./routes/teacher.routes";
import adminRoutes from "./routes/admin.routes";
import parentRoutes from "./routes/parent.routes";
import classRoutes from "./routes/class.routes";
import subjectRoutes from "./routes/subject.routes";
import attendanceRoutes from "./routes/attendance.routes";
import resultRoutes from "./routes/result.routes";
import routineRoutes from "./routes/routine.routes";
import leaveRoutes from "./routes/leave.routes";
import assignmentRoutes from "./routes/assignment.routes";
import noticeRoutes from "./routes/notice.routes";
import messageRoutes from "./routes/message.routes";
import notificationRoutes from "./routes/notification.routes";
import aiRoutes from "./routes/ai.routes";
import statsRoutes from "./routes/stats.routes";
import eventRoutes from "./routes/event.routes";
import timetableRoutes from "./routes/timetable.routes";

const app: Application = express();

app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Ensure database connection for serverless function invocations
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error("DB connection error in middleware:", err);
  }
  next();
});

// API Routes
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/parents", parentRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/routines", routineRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/stats", statsRoutes);

// Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "EduJira API Server & Socket.io is running successfully!",
    endpoints: [
      "/api/students",
      "/api/teachers",
      "/api/admins",
      "/api/parents",
      "/api/classes",
      "/api/subjects",
      "/api/attendance",
      "/api/results",
      "/api/routines",
      "/api/leaves",
      "/api/assignments",
      "/api/notices",
      "/api/messages",
      "/api/notifications",
      "/api/ai",
      "/api/stats",
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
