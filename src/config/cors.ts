import cors from "cors";

export const corsMiddleware = cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
});