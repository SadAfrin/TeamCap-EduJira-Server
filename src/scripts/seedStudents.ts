import * as dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import dotenv from "dotenv";
dotenv.config();

import connectDB from "../config/db";
import Student from "../models/Student.model";
import mongoose from "mongoose";

const students = [
  // Class 8 - B
  { studentId: "24-101", name: "Rahim Uddin", className: "Class 8", section: "B" },
  { studentId: "24-102", name: "Karim Ahmed", className: "Class 8", section: "B" },
  { studentId: "24-103", name: "Fatima Islam", className: "Class 8", section: "B" },
  { studentId: "24-104", name: "Ayesha Khan", className: "Class 8", section: "B" },
  { studentId: "24-105", name: "Nusrat Jahan", className: "Class 8", section: "B" },
  { studentId: "24-106", name: "Tanvir Hasan", className: "Class 8", section: "B" },
  { studentId: "24-107", name: "Imran Kabir", className: "Class 8", section: "B" },
  { studentId: "24-108", name: "Sadia Rahman", className: "Class 8", section: "B" },

  // Class 8 - A (new section for variety)
  { studentId: "24-111", name: "Farhan Ali", className: "Class 8", section: "A" },
  { studentId: "24-112", name: "Meherun Nesa", className: "Class 8", section: "A" },
  { studentId: "24-113", name: "Shakil Ahmed", className: "Class 8", section: "A" },
  { studentId: "24-114", name: "Rumana Akter", className: "Class 8", section: "A" },
  { studentId: "24-115", name: "Nayeem Hossain", className: "Class 8", section: "A" },

  // Class 9 - A
  { studentId: "24-201", name: "Mim Akter", className: "Class 9", section: "A" },
  { studentId: "24-202", name: "Sabbir Rahman", className: "Class 9", section: "A" },
  { studentId: "24-203", name: "Nabila Sultana", className: "Class 9", section: "A" },
  { studentId: "24-204", name: "Rakib Hasan", className: "Class 9", section: "A" },
  { studentId: "24-205", name: "Taslima Begum", className: "Class 9", section: "A" },
  { studentId: "24-206", name: "Ovi Chowdhury", className: "Class 9", section: "A" },
  { studentId: "24-207", name: "Jannatul Ferdous", className: "Class 9", section: "A" },

  // Class 9 - B
  { studentId: "24-211", name: "Hasib Khan", className: "Class 9", section: "B" },
  { studentId: "24-212", name: "Sumaiya Islam", className: "Class 9", section: "B" },
  { studentId: "24-213", name: "Arafat Hossain", className: "Class 9", section: "B" },
  { studentId: "24-214", name: "Priya Das", className: "Class 9", section: "B" },
  { studentId: "24-215", name: "Zahid Hasan", className: "Class 9", section: "B" },
];

async function seed() {
  await connectDB();
  await Student.deleteMany({});
  await Student.insertMany(students);
  console.log(`Seeded ${students.length} students`);
  await mongoose.connection.close();
}

seed();