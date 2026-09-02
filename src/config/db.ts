import mongoose from 'mongoose';
import dns from 'node:dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore if DNS server configuration is restricted
}

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI as string;
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in the .env file');
    }
    await mongoose.connect(mongoURI, {
      dbName: "EduJira",
    });
    console.log('Database connected successfully with Mongoose! (DB: EduJira)');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

export default connectDB;