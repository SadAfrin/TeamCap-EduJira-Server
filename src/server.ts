// src/server.ts (File-er ekdom top-e)
import * as dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']); // Google DNS set kore dilo network error fix korar jonno

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

startServer();