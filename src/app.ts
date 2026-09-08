import express from "express";
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

const app = express();

connectDB();

app.use(corsMiddleware);
app.use(express.json());

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

export default app;