import express from "express";
import { corsMiddleware } from "./config/cors";
import attendanceRoutes from "./routes/attendance.routes";
import studentRoutes from "./routes/student.routes";

const app = express();

app.use(corsMiddleware);
app.use(express.json());

app.use("/api/attendance", attendanceRoutes);
app.use("/api/students", studentRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;