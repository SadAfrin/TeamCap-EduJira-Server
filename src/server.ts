import * as dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import dotenv from 'dotenv';
dotenv.config();
import app from './app';
import connectDB from './config/db';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

// Only run the traditional listener locally — Vercel handles invocation itself
if (!process.env.VERCEL) {
  startServer();
} else {
  connectDB(); // still connect to DB on Vercel, just don't call .listen()
}

export default app;