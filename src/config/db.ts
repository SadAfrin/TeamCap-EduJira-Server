import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI as string;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in the .env file');
    }

    await mongoose.connect(mongoURI);
    console.log('Database connected successfully with Mongoose!');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1); // Error hole server stop kore dibe
  }
};

export default connectDB;