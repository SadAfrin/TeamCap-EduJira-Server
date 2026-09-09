import * as dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/db";
import Class from "../models/Class.model";
import Section from "../models/Section.model";
import Subject from "../models/Subject.model";
import Teacher from "../models/Teacher.model";
import Admin from "../models/Admin.model";
import Parent from "../models/Parent.model";
import Student from "../models/Student.model";
import Attendance from "../models/Attendance.model";
import Result from "../models/Result.model";
import Routine from "../models/Routine.model";
import Notice from "../models/Notice.model";
import Assignment from "../models/Assignment.model";
import EarlyWarningFlag from "../models/EarlyWarningFlag.model";
import LeaveApplication from "../models/LeaveApplication.model";

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
  { subjectCode: "MATH-08", name: "Mathematics", className: "Class 8", credits: 4, teacherName: "Mohammad Rafiq", teacherEmail: "mohammad.rafiq@edujira.edu", department: "Mathematics" },
  { subjectCode: "ENG-08", name: "English", className: "Class 8", credits: 3, teacherName: "Farzana Yasmin", teacherEmail: "farzana.yasmin@edujira.edu", department: "Languages" },
  { subjectCode: "SCI-08", name: "General Science", className: "Class 8", credits: 3, teacherName: "Dr. Anisur Rahman", teacherEmail: "anisur.rahman@edujira.edu", department: "Science" },
  { subjectCode: "ICT-08", name: "ICT & Computing", className: "Class 8", credits: 2, teacherName: "Tanvir Hasan", teacherEmail: "tanvir.hasan@edujira.edu", department: "Technology" },
  { subjectCode: "BGS-08", name: "Global Studies", className: "Class 8", credits: 3, teacherName: "Shamima Nasrin", teacherEmail: "shamima.admin@edujira.edu", department: "Humanities" },
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
    subject: "General Science",
    classes: ["Class 8-A", "Class 8-B", "Class 9-A", "Class 10-A"],
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
    subject: "English",
    classes: ["Class 6-A", "Class 7-A", "Class 8-B"],
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
    subject: "Mathematics",
    classes: ["Class 6-B", "Class 8-A", "Class 9-B", "Class 10-A"],
    joiningDate: "2017-03-20",
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
];

const defaultParents = [
  {
    parentId: "PAR-101",
    name: "Tariqul Islam",
    email: "tariqul.parent@edujira.edu",
    phone: "+880 1711-998877",
    occupation: "Civil Engineer",
    address: "House 42, Road 7, Dhanmondi, Dhaka",
    preferredLanguage: "en",
    children: [
      { studentId: "STD-801", studentName: "Rahim Uddin", className: "Class 8", section: "B" },
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
    preferredLanguage: "bn",
    children: [
      { studentId: "STD-803", studentName: "Fatima Islam", className: "Class 8", section: "B" },
      { studentId: "STD-902", studentName: "Sabbir Rahman", className: "Class 9", section: "A" },
    ],
    status: "Active",
  },
];

const defaultStudents = [
  {
    studentId: "STD-801",
    name: "Rahim Uddin",
    className: "Class 8",
    section: "B",
    roll: 1,
    email: "rahim@edujira.edu",
    phone: "+880 1711-101010",
    gender: "Male",
    dateOfBirth: "2011-04-12",
    bloodGroup: "A+",
    parentName: "Tariqul Islam",
    parentPhone: "+880 1711-998877",
    parentEmail: "tariqul.parent@edujira.edu",
    address: "Dhanmondi, Dhaka",
    status: "approved",
  },
  {
    studentId: "STD-803",
    name: "Fatima Islam",
    className: "Class 8",
    section: "B",
    roll: 3,
    email: "fatima@edujira.edu",
    phone: "+880 1711-101012",
    gender: "Female",
    dateOfBirth: "2011-09-22",
    bloodGroup: "O+",
    parentName: "Salma Begum",
    parentPhone: "+880 1811-887766",
    parentEmail: "salma.parent@edujira.edu",
    address: "Banani, Dhaka",
    status: "approved",
  },
  // Sample Pending Registration for Admin Approval Flow
  {
    studentId: "STD-9901",
    name: "Kazi Tanvir Ahsan",
    desiredClass: "Class 9",
    className: "",
    section: "",
    email: "tanvir.applicant@gmail.com",
    phone: "+880 1799-887766",
    gender: "Male",
    dateOfBirth: "2010-05-18",
    bloodGroup: "B+",
    parentName: "Kazi Ahsan Habib",
    parentEmail: "ahsan.habib@gmail.com",
    parentPhone: "+880 1712-334455",
    address: "Uttara Sector 11, Dhaka",
    previousSchool: "St. Joseph Higher Secondary School",
    previousGPA: "4.85 / 5.00",
    documents: [
      "https://example.com/docs/jsc_transcript.pdf",
      "https://example.com/docs/birth_certificate.pdf",
    ],
    status: "pending",
  },
  {
    studentId: "STD-9902",
    name: "Afrin Sultana",
    desiredClass: "Class 8",
    className: "",
    section: "",
    email: "afrin.applicant@gmail.com",
    phone: "+880 1855-443322",
    gender: "Female",
    dateOfBirth: "2011-10-04",
    bloodGroup: "A+",
    parentName: "Sultana Razia",
    parentEmail: "razia.parent@gmail.com",
    parentPhone: "+880 1811-223344",
    address: "Mirpur DOHS, Dhaka",
    previousSchool: "Viqarunnisa Noon School",
    previousGPA: "5.00 / 5.00",
    documents: ["https://example.com/docs/transfer_cert.pdf"],
    status: "pending",
  },
];

async function seed() {
  try {
    console.log("Connecting to MongoDB for seeding...");
    await connectDB();

    console.log("Seeding Classes & Sections...");
    await Class.deleteMany({});
    await Section.deleteMany({});
    for (const c of defaultClasses) {
      const createdClass = await Class.create(c);
      for (const sec of c.sections) {
        await Section.create({
          name: sec,
          classId: createdClass._id,
          className: c.className,
          capacity: c.capacity,
          currentCount: sec === "B" && c.className === "Class 8" ? 2 : 0,
          roomNumber: c.roomNumber,
        });
      }
    }

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
    await Attendance.create([
      { studentId: "STD-801", studentName: "Rahim Uddin", className: "Class 8", section: "B", date: today, status: "Present" },
      { studentId: "STD-803", studentName: "Fatima Islam", className: "Class 8", section: "B", date: today, status: "Present" },
    ]);

    console.log("Seeding Results / Grades...");
    await Result.deleteMany({});
    await Result.insertMany([
      { studentId: "STD-801", studentName: "Rahim Uddin", studentEmail: "rahim@edujira.edu", className: "Class 8", section: "B", subjectName: "Mathematics", subjectCode: "MATH-08", term: "Mid Term", marks: 92, grade: "A+", gpa: 5.0, teacherRemarks: "Outstanding analytical ability", aiNarrativeComment: "Rahim demonstrated exemplary mathematical acumen and problem solving this term." },
      { studentId: "STD-801", studentName: "Rahim Uddin", studentEmail: "rahim@edujira.edu", className: "Class 8", section: "B", subjectName: "General Science", subjectCode: "SCI-08", term: "Mid Term", marks: 88, grade: "A+", gpa: 5.0, teacherRemarks: "Very active in lab demos" },
      { studentId: "STD-801", studentName: "Rahim Uddin", studentEmail: "rahim@edujira.edu", className: "Class 8", section: "B", subjectName: "English", subjectCode: "ENG-08", term: "Mid Term", marks: 81, grade: "A+", gpa: 5.0, teacherRemarks: "Good vocabulary and essay structure" },
      { studentId: "STD-801", studentName: "Rahim Uddin", studentEmail: "rahim@edujira.edu", className: "Class 8", section: "B", subjectName: "ICT & Computing", subjectCode: "ICT-08", term: "Mid Term", marks: 95, grade: "A+", gpa: 5.0, teacherRemarks: "Superb programming project" },
    ]);

    console.log("Seeding Class Routines...");
    await Routine.deleteMany({});
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
    for (const day of days) {
      await Routine.create({
        className: "Class 8",
        section: "B",
        day,
        periodSlots: [
          { period: "1st Period", time: "09:00 - 09:45 AM", subject: "Mathematics", teacher: "Mohammad Rafiq", teacherEmail: "mohammad.rafiq@edujira.edu", room: "Room 201" },
          { period: "2nd Period", time: "09:50 - 10:35 AM", subject: "English Literature", teacher: "Farzana Yasmin", teacherEmail: "farzana.yasmin@edujira.edu", room: "Room 201" },
          { period: "3rd Period", time: "10:40 - 11:25 AM", subject: "General Science", teacher: "Dr. Anisur Rahman", teacherEmail: "anisur.rahman@edujira.edu", room: "Room 201" },
          { period: "4th Period", time: "11:45 - 12:30 PM", subject: "ICT & Computing", teacher: "Tanvir Hasan", teacherEmail: "tanvir.hasan@edujira.edu", room: "Computer Lab" },
        ],
      });
    }

    console.log("Seeding Notices...");
    await Notice.deleteMany({});
    await Notice.insertMany([
      {
        title: "Mid-Term Examination Routine Published",
        body: "The Mid-Term examinations for all grades will commence from next Sunday. All students are instructed to collect their admit cards from the admin counter.",
        targetType: "all",
        category: "Academic",
        priority: "high",
        createdBy: "Head Administrator",
        isDeleted: false,
      },
      {
        title: "Parent-Teacher Conference (Grade 8 & 9)",
        body: "Parent-Teacher conference will be held this Saturday from 10:00 AM to 1:00 PM in the central auditorium to discuss student progress.",
        targetType: "role",
        targetRole: "parent",
        category: "Event",
        priority: "normal",
        createdBy: "Academic Coordinator",
        isDeleted: false,
      },
      {
        title: "Science Club Annual Project Submission",
        body: "Grade 8 and Grade 9 science enthusiasts are invited to submit their science exhibition project abstracts by the 25th of this month.",
        targetType: "class",
        className: "Class 8",
        category: "Event",
        priority: "normal",
        createdBy: "Science Faculty",
        isDeleted: false,
      },
    ]);

    console.log("Seeding Assignments...");
    await Assignment.deleteMany({});
    await Assignment.create({
      title: "Algebraic Expressions & Factorization Problem Set",
      description: "Solve Exercise 4.2 Questions 1 to 15 from Chapter 4 of the textbook. Write step-by-step proofs.",
      className: "Class 8",
      section: "B",
      subjectName: "Mathematics",
      teacherName: "Mohammad Rafiq",
      teacherEmail: "mohammad.rafiq@edujira.edu",
      deadline: "2026-09-20",
      totalMarks: 25,
      submissions: [
        {
          studentId: "STD-801",
          studentName: "Rahim Uddin",
          studentEmail: "rahim@edujira.edu",
          submissionText: "Completed all 15 questions with formula derivations.",
          fileUrl: "https://example.com/submissions/rahim_math_hw.pdf",
          submittedAt: new Date(),
          marksObtained: 24,
          feedback: "Excellent precision in Step 7 of Problem 12!",
          status: "graded",
        },
      ],
    });

    console.log("Database seeded successfully with all initial sample records!");
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Failed to seed database:", err);
    process.exit(1);
  }
}

seed();
