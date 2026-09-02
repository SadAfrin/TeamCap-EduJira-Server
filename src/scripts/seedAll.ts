import * as dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/db";
import Class from "../models/Class.model";
import Subject from "../models/Subject.model";
import Teacher from "../models/Teacher.model";
import Admin from "../models/Admin.model";
import Parent from "../models/Parent.model";
import Student from "../models/Student.model";
import Attendance from "../models/Attendance.model";

const defaultClasses = [
  {
    className: "Class 6",
    gradeLevel: 6,
    sections: ["A", "B"],
    subjects: ["Bangla", "English", "Mathematics", "General Science", "Social Science", "ICT"],
    classTeacher: "Mohammad Rafiq",
    roomNumber: "Room 101",
    capacity: 40,
    description: "Junior Secondary Grade 6",
  },
  {
    className: "Class 7",
    gradeLevel: 7,
    sections: ["A", "B"],
    subjects: ["Bangla", "English", "Mathematics", "General Science", "Social Science", "ICT"],
    classTeacher: "Farzana Yasmin",
    roomNumber: "Room 102",
    capacity: 40,
    description: "Junior Secondary Grade 7",
  },
  {
    className: "Class 8",
    gradeLevel: 8,
    sections: ["A", "B", "C"],
    subjects: ["Bangla", "English", "Mathematics", "General Science", "Bangladesh & Global Studies", "ICT", "Religion"],
    classTeacher: "Dr. Anisur Rahman",
    roomNumber: "Room 201",
    capacity: 45,
    description: "Junior School Certificate (JSC) Batch",
  },
  {
    className: "Class 9",
    gradeLevel: 9,
    sections: ["A", "B"],
    subjects: ["Bangla", "English", "General Math", "Higher Math", "Physics", "Chemistry", "Biology", "ICT"],
    classTeacher: "Nasrin Sultana",
    roomNumber: "Room 301",
    capacity: 45,
    description: "Secondary Science Division",
  },
  {
    className: "Class 10",
    gradeLevel: 10,
    sections: ["A", "B"],
    subjects: ["Bangla", "English", "General Math", "Higher Math", "Physics", "Chemistry", "Biology", "ICT"],
    classTeacher: "Kabir Hossain",
    roomNumber: "Room 302",
    capacity: 45,
    description: "SSC Candidate Batch",
  },
];

const defaultSubjects = [
  { subjectCode: "MATH-06", name: "Mathematics", className: "Class 6", type: "Core", credits: 4, teacherName: "Mohammad Rafiq", description: "Foundational arithmetic and geometry" },
  { subjectCode: "ENG-06", name: "English", className: "Class 6", type: "Core", credits: 3, teacherName: "Farzana Yasmin", description: "Grammar and composition" },
  { subjectCode: "SCI-06", name: "General Science", className: "Class 6", type: "Core", credits: 3, teacherName: "Dr. Anisur Rahman", description: "Introduction to nature and physical science" },

  { subjectCode: "MATH-08", name: "Mathematics", className: "Class 8", type: "Core", credits: 4, teacherName: "Mohammad Rafiq", description: "Algebra, geometry and statistics" },
  { subjectCode: "ENG-08", name: "English", className: "Class 8", type: "Core", credits: 3, teacherName: "Farzana Yasmin", description: "Literature and creative writing" },
  { subjectCode: "SCI-08", name: "General Science", className: "Class 8", type: "Core", credits: 3, teacherName: "Dr. Anisur Rahman", description: "Physics, Chemistry and Life Sciences" },
  { subjectCode: "ICT-08", name: "ICT", className: "Class 8", type: "Core", credits: 2, teacherName: "Tanvir Hasan", description: "Information and Communication Technology" },

  { subjectCode: "PHY-09", name: "Physics", className: "Class 9", type: "Core", credits: 4, teacherName: "Dr. Anisur Rahman", description: "Mechanics, Heat, Waves, and Optics" },
  { subjectCode: "CHEM-09", name: "Chemistry", className: "Class 9", type: "Core", credits: 4, teacherName: "Nasrin Sultana", description: "Inorganic & Physical Chemistry" },
  { subjectCode: "HMATH-09", name: "Higher Math", className: "Class 9", type: "Elective", credits: 4, teacherName: "Mohammad Rafiq", description: "Trigonometry and Coordinate Geometry" },
  { subjectCode: "BIO-09", name: "Biology", className: "Class 9", type: "Core", credits: 3, teacherName: "Kabir Hossain", description: "Cell biology and human anatomy" },

  { subjectCode: "PHY-10", name: "Physics", className: "Class 10", type: "Core", credits: 4, teacherName: "Dr. Anisur Rahman", description: "Electricity, Modern Physics and Nuclear energy" },
  { subjectCode: "CHEM-10", name: "Chemistry", className: "Class 10", type: "Core", credits: 4, teacherName: "Nasrin Sultana", description: "Organic Chemistry and Periodic Properties" },
];

const defaultTeachers = [
  {
    teacherId: "TCH-101",
    name: "Dr. Anisur Rahman",
    email: "anisur.rahman@edujira.edu",
    phone: "+880 1711-223344",
    designation: "Senior Science Teacher",
    qualification: "Ph.D in Applied Physics, DU",
    gender: "Male",
    subjectsAssigned: ["General Science", "Physics"],
    classesAssigned: ["Class 8-A", "Class 8-B", "Class 9-A", "Class 10-A"],
    joiningDate: "2018-01-15",
    status: "Active",
  },
  {
    teacherId: "TCH-102",
    name: "Farzana Yasmin",
    email: "farzana.yasmin@edujira.edu",
    phone: "+880 1819-334455",
    designation: "Head of English Department",
    qualification: "M.A in English Literature, JU",
    gender: "Female",
    subjectsAssigned: ["English", "English Grammar"],
    classesAssigned: ["Class 6-A", "Class 7-A", "Class 8-B"],
    joiningDate: "2019-06-01",
    status: "Active",
  },
  {
    teacherId: "TCH-103",
    name: "Mohammad Rafiq",
    email: "mohammad.rafiq@edujira.edu",
    phone: "+880 1912-445566",
    designation: "Assistant Professor - Mathematics",
    qualification: "M.Sc in Pure Mathematics, RU",
    gender: "Male",
    subjectsAssigned: ["Mathematics", "Higher Math"],
    classesAssigned: ["Class 6-B", "Class 8-A", "Class 9-B", "Class 10-A"],
    joiningDate: "2017-03-20",
    status: "Active",
  },
  {
    teacherId: "TCH-104",
    name: "Nasrin Sultana",
    email: "nasrin.sultana@edujira.edu",
    phone: "+880 1613-556677",
    designation: "Chemistry Lecturer",
    qualification: "M.Sc in Chemistry, BUET",
    gender: "Female",
    subjectsAssigned: ["Chemistry", "General Science"],
    classesAssigned: ["Class 9-A", "Class 9-B", "Class 10-B"],
    joiningDate: "2020-08-10",
    status: "Active",
  },
  {
    teacherId: "TCH-105",
    name: "Kabir Hossain",
    email: "kabir.hossain@edujira.edu",
    phone: "+880 1514-667788",
    designation: "Biology Specialist",
    qualification: "M.Sc in Botany, CU",
    gender: "Male",
    subjectsAssigned: ["Biology"],
    classesAssigned: ["Class 9-A", "Class 10-A"],
    joiningDate: "2021-02-01",
    status: "Active",
  },
];

const defaultAdmins = [
  {
    adminId: "ADM-001",
    name: "Super Admin",
    email: "admin@edujira.edu",
    phone: "+880 1700-112233",
    designation: "Head Administrator & Principal",
    permissions: ["all", "manage_users", "academic_settings", "system_audit"],
    status: "Active",
  },
  {
    adminId: "ADM-002",
    name: "Zobaer Zisan",
    email: "zobaer.zisan@gmail.com",
    phone: "+880 1800-223344",
    designation: "Academic Dean & IT Director",
    permissions: ["all", "manage_students", "manage_teachers", "reports"],
    status: "Active",
  },
  {
    adminId: "ADM-003",
    name: "Shamima Nasrin",
    email: "shamima.admin@edujira.edu",
    phone: "+880 1900-334455",
    designation: "Admission Coordinator",
    permissions: ["manage_students", "manage_parents", "classes"],
    status: "Active",
  },
];

const defaultParents = [
  {
    parentId: "PAR-101",
    name: "Tariqul Islam",
    email: "tariqul.parent@edujira.edu",
    phone: "+880 1711-998877",
    occupation: "Civil Engineer",
    address: "House 42, Road 7, Dhanmondi, Dhaka",
    children: [
      { studentId: "STD-801", studentName: "Rahim Uddin", className: "Class 8", section: "B", relationship: "Father" },
    ],
    status: "Active",
  },
  {
    parentId: "PAR-102",
    name: "Salma Begum",
    email: "salma.parent@edujira.edu",
    phone: "+880 1811-887766",
    occupation: "Doctor (Pediatrician)",
    address: "Block C, Banani, Dhaka",
    children: [
      { studentId: "STD-803", studentName: "Fatima Islam", className: "Class 8", section: "B", relationship: "Mother" },
      { studentId: "STD-902", studentName: "Sabbir Rahman", className: "Class 9", section: "A", relationship: "Mother" },
    ],
    status: "Active",
  },
  {
    parentId: "PAR-103",
    name: "Mahmudul Hasan",
    email: "mahmudul.parent@edujira.edu",
    phone: "+880 1911-776655",
    occupation: "Business Executive",
    address: "Uttara Sector 4, Dhaka",
    children: [
      { studentId: "STD-806", studentName: "Tanvir Hasan", className: "Class 8", section: "B", relationship: "Father" },
    ],
    status: "Active",
  },
];

const defaultStudents = [
  // Class 8 - B
  { studentId: "STD-801", name: "Rahim Uddin", className: "Class 8", section: "B", roll: 1, email: "rahim@edujira.edu", phone: "+880 1711-101010", gender: "Male", dateOfBirth: "2011-04-12", bloodGroup: "A+", parentName: "Tariqul Islam", parentPhone: "+880 1711-998877", parentEmail: "tariqul.parent@edujira.edu", address: "Dhanmondi, Dhaka", status: "Active" },
  { studentId: "STD-802", name: "Karim Ahmed", className: "Class 8", section: "B", roll: 2, email: "karim@edujira.edu", phone: "+880 1711-101011", gender: "Male", dateOfBirth: "2011-06-18", bloodGroup: "B+", parentName: "Anwar Ahmed", parentPhone: "+880 1711-998801", parentEmail: "anwar@gmail.com", address: "Mirpur 10, Dhaka", status: "Active" },
  { studentId: "STD-803", name: "Fatima Islam", className: "Class 8", section: "B", roll: 3, email: "fatima@edujira.edu", phone: "+880 1711-101012", gender: "Female", dateOfBirth: "2011-09-22", bloodGroup: "O+", parentName: "Salma Begum", parentPhone: "+880 1811-887766", parentEmail: "salma.parent@edujira.edu", address: "Banani, Dhaka", status: "Active" },
  { studentId: "STD-804", name: "Ayesha Khan", className: "Class 8", section: "B", roll: 4, email: "ayesha@edujira.edu", phone: "+880 1711-101013", gender: "Female", dateOfBirth: "2011-01-15", bloodGroup: "AB+", parentName: "Jahangir Khan", parentPhone: "+880 1711-998802", parentEmail: "jahangir@gmail.com", address: "Gulshan 1, Dhaka", status: "Active" },
  { studentId: "STD-805", name: "Nusrat Jahan", className: "Class 8", section: "B", roll: 5, email: "nusrat@edujira.edu", phone: "+880 1711-101014", gender: "Female", dateOfBirth: "2011-11-05", bloodGroup: "A-", parentName: "Kamrul Islam", parentPhone: "+880 1711-998803", parentEmail: "kamrul@gmail.com", address: "Mohammadpur, Dhaka", status: "Active" },
  { studentId: "STD-806", name: "Tanvir Hasan", className: "Class 8", section: "B", roll: 6, email: "tanvir@edujira.edu", phone: "+880 1711-101015", gender: "Male", dateOfBirth: "2011-03-30", bloodGroup: "O-", parentName: "Mahmudul Hasan", parentPhone: "+880 1911-776655", parentEmail: "mahmudul.parent@edujira.edu", address: "Uttara, Dhaka", status: "Active" },

  // Class 8 - A
  { studentId: "STD-811", name: "Farhan Ali", className: "Class 8", section: "A", roll: 1, email: "farhan@edujira.edu", phone: "+880 1711-101016", gender: "Male", dateOfBirth: "2011-05-14", bloodGroup: "B+", parentName: "Ali Hossain", parentPhone: "+880 1711-998804", address: "Bashundhara, Dhaka", status: "Active" },
  { studentId: "STD-812", name: "Meherun Nesa", className: "Class 8", section: "A", roll: 2, email: "meherun@edujira.edu", phone: "+880 1711-101017", gender: "Female", dateOfBirth: "2011-08-09", bloodGroup: "A+", parentName: "Nazrul Islam", parentPhone: "+880 1711-998805", address: "Khilgaon, Dhaka", status: "Active" },
  { studentId: "STD-813", name: "Shakil Ahmed", className: "Class 8", section: "A", roll: 3, email: "shakil@edujira.edu", phone: "+880 1711-101018", gender: "Male", dateOfBirth: "2011-07-21", bloodGroup: "O+", parentName: "Rashid Ahmed", parentPhone: "+880 1711-998806", address: "Malibagh, Dhaka", status: "Active" },

  // Class 9 - A
  { studentId: "STD-901", name: "Mim Akter", className: "Class 9", section: "A", roll: 1, email: "mim@edujira.edu", phone: "+880 1711-101020", gender: "Female", dateOfBirth: "2010-02-14", bloodGroup: "A+", parentName: "Rezaul Karim", parentPhone: "+880 1711-998807", address: "Badda, Dhaka", status: "Active" },
  { studentId: "STD-902", name: "Sabbir Rahman", className: "Class 9", section: "A", roll: 2, email: "sabbir@edujira.edu", phone: "+880 1711-101021", gender: "Male", dateOfBirth: "2010-10-10", bloodGroup: "B+", parentName: "Salma Begum", parentPhone: "+880 1811-887766", parentEmail: "salma.parent@edujira.edu", address: "Banani, Dhaka", status: "Active" },
  { studentId: "STD-903", name: "Nabila Sultana", className: "Class 9", section: "A", roll: 3, email: "nabila@edujira.edu", phone: "+880 1711-101022", gender: "Female", dateOfBirth: "2010-12-01", bloodGroup: "O+", parentName: "Mizanur Rahman", parentPhone: "+880 1711-998808", address: "Rampura, Dhaka", status: "Active" },

  // Class 10 - A
  { studentId: "STD-1001", name: "Hasib Khan", className: "Class 10", section: "A", roll: 1, email: "hasib@edujira.edu", phone: "+880 1711-101030", gender: "Male", dateOfBirth: "2009-03-25", bloodGroup: "A+", parentName: "Arif Khan", parentPhone: "+880 1711-998809", address: "Motijheel, Dhaka", status: "Active" },
  { studentId: "STD-1002", name: "Sumaiya Islam", className: "Class 10", section: "A", roll: 2, email: "sumaiya@edujira.edu", phone: "+880 1711-101031", gender: "Female", dateOfBirth: "2009-09-19", bloodGroup: "AB+", parentName: "Sirajul Islam", parentPhone: "+880 1711-998810", address: "Lalbagh, Dhaka", status: "Active" },
];

async function seed() {
  try {
    console.log("Connecting to MongoDB for seeding...");
    await connectDB();

    console.log("Seeding Classes...");
    await Class.deleteMany({});
    await Class.insertMany(defaultClasses);

    console.log("Seeding Subjects...");
    await Subject.deleteMany({});
    await Subject.insertMany(defaultSubjects);

    console.log("Seeding Teachers...");
    await Teacher.deleteMany({});
    await Teacher.insertMany(defaultTeachers);

    console.log("Seeding Admins...");
    await Admin.deleteMany({});
    await Admin.insertMany(defaultAdmins);

    console.log("Seeding Parents...");
    await Parent.deleteMany({});
    await Parent.insertMany(defaultParents);

    console.log("Seeding Students...");
    await Student.deleteMany({});
    await Student.insertMany(defaultStudents);

    console.log("Seeding Attendance records...");
    await Attendance.deleteMany({});
    const today = new Date().toISOString().split("T")[0];
    const attendanceRecords = defaultStudents.map((st, idx) => ({
      studentId: st.studentId,
      studentName: st.name,
      className: st.className,
      section: st.section,
      date: today,
      status: idx % 6 === 5 ? "Absent" : idx % 6 === 4 ? "Late" : "Present",
      remarks: idx % 6 === 5 ? "Sick leave reported" : "",
    }));
    await Attendance.insertMany(attendanceRecords);

    console.log("Database seeded successfully with all collections in 'EduJira'!");
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Failed to seed database:", err);
    process.exit(1);
  }
}

seed();
