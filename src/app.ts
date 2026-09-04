import express from "express";
import path from "path";
import { corsMiddleware } from "./config/cors";
import connectDB from "./config/db";

// Import routes
import leaveRoutes from "./routes/leave.routes";
import messageRoutes from "./routes/message.routes";
import uploadRoutes from "./routes/upload.routes";
import studentRoutes from "./routes/student.routes";
import attendanceRoutes from "./routes/attendance.routes";

const app = express();

connectDB();

app.use(corsMiddleware);
app.use(express.json());

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Mount routes
app.use("/api/leave", leaveRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/attendance", attendanceRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "EduJira Server is running successfully!",
  });
});

export default app;