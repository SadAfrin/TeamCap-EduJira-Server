import cors from "cors";

const clientOrigin = (process.env.CLIENT_URL || "http://localhost:3000").replace(/\/$/, "");

export const corsMiddleware = cors({
  origin: clientOrigin,
  credentials: true,
});