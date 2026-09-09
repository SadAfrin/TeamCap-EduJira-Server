import * as dns from "node:dns";
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
  dns.setDefaultResultOrder?.("ipv4first");
} catch {
  // Ignore if DNS server configuration is restricted
}

import dotenv from "dotenv";
dotenv.config();
import http from 'http';
import app from './app';
import connectDB from './config/db';
import { initSocket } from './lib/socket';

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);
initSocket(httpServer);

async function startServer() {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`EduJira Server + Socket.io running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
}

// Only run the traditional listener locally — Vercel handles invocation itself
if (!process.env.VERCEL) {
  startServer();
} else {
  connectDB();
}

export default app;
