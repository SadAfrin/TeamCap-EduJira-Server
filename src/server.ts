import * as dns from "node:dns";
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
  dns.setDefaultResultOrder?.("ipv4first");
} catch {
  // Ignore if DNS server configuration is restricted
}

import dotenv from "dotenv";
dotenv.config();
import http from "http";
import app from "./app";
import connectDB from "./config/db";
import { initSocket } from "./config/socket";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    // Create HTTP server
    const httpServer = http.createServer(app);

    // Initialize Socket.io
    const io = initSocket(httpServer);

    // Make io instance globally available if needed
    (global as any).io = io;

    httpServer.listen(PORT, () => {
      console.log(`EduJira Server is running on port ${PORT}`);
      console.log(`Socket.io ready for real-time messaging`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
}

// Only run the traditional listener locally — Vercel handles invocation itself
if (!process.env.VERCEL) {
  startServer();
} else {
  connectDB(); // still connect to DB on Vercel, just don't call .listen()
}

export default app;
