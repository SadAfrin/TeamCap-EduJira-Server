import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "dns";
import app from "./app";

// Load environment variables
dotenv.config();

// Fix for Node.js DNS resolution order on Windows
dns.setDefaultResultOrder("ipv4first");

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in environment variables");
  process.exit(1);
}

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully");
    app.listen(PORT, () => {
      console.log(`EduJira Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });
