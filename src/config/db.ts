import mongoose from 'mongoose';

let isConnected = false;

const connectDB = async (): Promise<void> => {
  if (isConnected) return;
  try {
    const mongoURI = process.env.MONGODB_URI as string;
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in the .env file');
    }
    await mongoose.connect(mongoURI);
    isConnected = true;
    console.log('Database connected successfully with Mongoose!');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
};

export default connectDB;