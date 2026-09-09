import mongoose from 'mongoose';
import dns from 'node:dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore if DNS server configuration is restricted
}

let isConnected = false;

const connectDB = async (): Promise<void> => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    const mongoURI = process.env.MONGODB_URI as string;
    if (!mongoURI) {
      console.warn('MONGODB_URI is not defined in environment variables');
      return;
    }

    await mongoose.connect(mongoURI, {
      dbName: "EduJira",
      bufferCommands: false,
    });
    isConnected = true;
    console.log('Database connected successfully with Mongoose! (DB: EduJira)');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
};

export default connectDB;