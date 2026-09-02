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
app.use("/api/stats", statsRoutes);

// Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "EduJira API Server is running successfully!",
    endpoints: [
      "/api/students",
      "/api/teachers",
      "/api/admins",
      "/api/parents",
      "/api/classes",
      "/api/subjects",
      "/api/attendance",
      "/api/stats/overview",
    ],
  });
});

export default app;