import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import apiRoutes from "./routes/index";

const app: Application = express();

// Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "EduJira Server is running",
    version: "1.0.0",
    endpoints: {
      calendar: "/api/calendar",
      timetable: "/api/timetable",
      attendance: "/api/attendance",
    },
  });
});

// Mount API routes
app.use("/api", apiRoutes);

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
