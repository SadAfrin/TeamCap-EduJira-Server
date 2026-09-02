import express from "express";
import { corsMiddleware } from "./config/cors";
import connectDB from "./config/db";

const app = express();

connectDB();

app.use(corsMiddleware);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "EduJira Server is running successfully!",
  });
});

export default app;