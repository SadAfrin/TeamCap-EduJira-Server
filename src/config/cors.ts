import cors from "cors";

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow all origins or requests with no origin in production/preview
    callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With"],
});