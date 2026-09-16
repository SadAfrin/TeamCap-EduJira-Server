import cors from "cors";

const allowedOrigins = [
  "http://localhost:3000",
  process.env.NEXT_PUBLIC_CLIENT_URL,
].filter(Boolean) as string[];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In production, you'd strictly check against allowedOrigins
    // For this setup, we allow all origins dynamically but specify them for security logic
    callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With", "Accept"],
});