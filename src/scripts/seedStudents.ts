import * as dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/db";
import Student from "../models/Student.model";

const studentsData = [
  // Class 1
  { studentId: "STD-1001", name: "Arian Ahmed", email: "arian@edujira.edu", className: "Class 1", section: "A", roll: 1001, gender: "Male", dateOfBirth: "2018-03-12", status: "approved" },
  { studentId: "STD-1002", name: "Sara Khan", email: "sara@edujira.edu", className: "Class 1", section: "A", roll: 1002, gender: "Female", dateOfBirth: "2018-07-22", status: "approved" },
  { studentId: "STD-1003", name: "Nabil Islam", email: "nabil1@edujira.edu", className: "Class 1", section: "B", roll: 1003, gender: "Male", dateOfBirth: "2018-01-05", status: "approved" },
  { studentId: "STD-1004", name: "Maimuna Rahman", email: "maimuna@edujira.edu", className: "Class 1", section: "B", roll: 1004, gender: "Female", dateOfBirth: "2018-11-19", status: "approved" },
  { studentId: "STD-1005", name: "Zuhayer Hossain", email: "zuhayer@edujira.edu", className: "Class 1", section: "A", roll: 1005, gender: "Male", dateOfBirth: "2018-05-30", status: "approved" },

  // Class 2
  { studentId: "STD-2001", name: "Tasin Mahmud", email: "tasin@edujira.edu", className: "Class 2", section: "A", roll: 2001, gender: "Male", dateOfBirth: "2017-02-14", status: "approved" },
  { studentId: "STD-2002", name: "Ayra Tabassum", email: "ayra@edujira.edu", className: "Class 2", section: "A", roll: 2002, gender: "Female", dateOfBirth: "2017-08-10", status: "approved" },
  { studentId: "STD-2003", name: "Samiul Hasan", email: "samiul2@edujira.edu", className: "Class 2", section: "B", roll: 2003, gender: "Male", dateOfBirth: "2017-04-25", status: "approved" },
  { studentId: "STD-2004", name: "Inaya Binte", email: "inaya@edujira.edu", className: "Class 2", section: "B", roll: 2004, gender: "Female", dateOfBirth: "2017-10-02", status: "approved" },
  { studentId: "STD-2005", name: "Hamza Ali", email: "hamza@edujira.edu", className: "Class 2", section: "A", roll: 2005, gender: "Male", dateOfBirth: "2017-06-18", status: "approved" },

  // Class 3
  { studentId: "STD-3001", name: "Farhan Zarif", email: "farhan@edujira.edu", className: "Class 3", section: "A", roll: 3001, gender: "Male", dateOfBirth: "2016-01-20", status: "approved" },
  { studentId: "STD-3002", name: "Ayesha Siddiqua", email: "ayesha@edujira.edu", className: "Class 3", section: "A", roll: 3002, gender: "Female", dateOfBirth: "2016-09-15", status: "approved" },
  { studentId: "STD-3003", name: "Rayan Chowdury", email: "rayan@edujira.edu", className: "Class 3", section: "B", roll: 3003, gender: "Male", dateOfBirth: "2016-05-11", status: "approved" },
  { studentId: "STD-3004", name: "Fariha Nusrat", email: "fariha3@edujira.edu", className: "Class 3", section: "B", roll: 3004, gender: "Female", dateOfBirth: "2016-12-04", status: "approved" },
  { studentId: "STD-3005", name: "Ibrahim Khalil", email: "ibrahim@edujira.edu", className: "Class 3", section: "A", roll: 3005, gender: "Male", dateOfBirth: "2016-03-28", status: "approved" },

  // Class 4
  { studentId: "STD-4001", name: "Alvi Rahman", email: "alvi@edujira.edu", className: "Class 4", section: "A", roll: 4001, gender: "Male", dateOfBirth: "2015-04-16", status: "approved" },
  { studentId: "STD-4002", name: "Humaira Jahan", email: "humaira4@edujira.edu", className: "Class 4", section: "A", roll: 4002, gender: "Female", dateOfBirth: "2015-11-23", status: "approved" },
  { studentId: "STD-4003", name: "Zubayer Ahmed", email: "zubayer@edujira.edu", className: "Class 4", section: "B", roll: 4003, gender: "Male", dateOfBirth: "2015-02-08", status: "approved" },
  { studentId: "STD-4004", name: "Tanjina Akter", email: "tanjina@edujira.edu", className: "Class 4", section: "B", roll: 4004, gender: "Female", dateOfBirth: "2015-07-12", status: "approved" },
  { studentId: "STD-4005", name: "Shafin Mustafa", email: "shafin@edujira.edu", className: "Class 4", section: "A", roll: 4005, gender: "Male", dateOfBirth: "2015-10-05", status: "approved" },

  // Class 5
  { studentId: "STD-5001", name: "Adiyan Karim", email: "adiyan@edujira.edu", className: "Class 5", section: "A", roll: 5001, gender: "Male", dateOfBirth: "2014-05-19", status: "approved" },
  { studentId: "STD-5002", name: "Mehreen Naz", email: "mehreen@edujira.edu", className: "Class 5", section: "A", roll: 5002, gender: "Female", dateOfBirth: "2014-01-31", status: "approved" },
  { studentId: "STD-5003", name: "Ahnaf Kabir", email: "ahnaf@edujira.edu", className: "Class 5", section: "B", roll: 5003, gender: "Male", dateOfBirth: "2014-08-14", status: "approved" },
  { studentId: "STD-5004", name: "Sumaiya Afrose", email: "sumaiya@edujira.edu", className: "Class 5", section: "B", roll: 5004, gender: "Female", dateOfBirth: "2014-03-27", status: "approved" },
  { studentId: "STD-5005", name: "Naheem Islam", email: "naheem@edujira.edu", className: "Class 5", section: "A", roll: 5005, gender: "Male", dateOfBirth: "2014-12-09", status: "approved" },

  // Class 6
  { studentId: "STD-6001", name: "Anika Tabassum", email: "anika6@edujira.edu", className: "Class 6", section: "A", roll: 6001, gender: "Female", dateOfBirth: "2013-02-14", status: "approved" },
  { studentId: "STD-6002", name: "Mahir Faysal", email: "mahir6@edujira.edu", className: "Class 6", section: "B", roll: 6002, gender: "Male", dateOfBirth: "2013-09-05", status: "approved" },
  { studentId: "STD-6003", name: "Shahriar Alom", email: "shahriar6@edujira.edu", className: "Class 6", section: "A", roll: 6003, gender: "Male", dateOfBirth: "2013-05-31", status: "approved" },
  { studentId: "STD-6004", name: "Labiba Haque", email: "labiba@edujira.edu", className: "Class 6", section: "B", roll: 6004, gender: "Female", dateOfBirth: "2013-07-21", status: "approved" },
  { studentId: "STD-6005", name: "Tanveer Reza", email: "tanveer@edujira.edu", className: "Class 6", section: "A", roll: 6005, gender: "Male", dateOfBirth: "2013-11-11", status: "approved" },

  // Class 7
  { studentId: "STD-7001", name: "Mehnaz Chowdhury", email: "mehnaz7@edujira.edu", className: "Class 7", section: "A", roll: 7001, gender: "Female", dateOfBirth: "2012-07-19", status: "approved" },
  { studentId: "STD-7002", name: "Samiul Islam", email: "samiul7@edujira.edu", className: "Class 7", section: "B", roll: 7002, gender: "Male", dateOfBirth: "2012-11-08", status: "approved" },
  { studentId: "STD-7003", name: "Faria Haque", email: "faria7@edujira.edu", className: "Class 7", section: "B", roll: 7003, gender: "Female", dateOfBirth: "2012-01-21", status: "approved" },
  { studentId: "STD-7004", name: "Asif Iqbal", email: "asif@edujira.edu", className: "Class 7", section: "A", roll: 7004, gender: "Male", dateOfBirth: "2012-04-03", status: "approved" },
  { studentId: "STD-7005", name: "Nusrat Jahan", email: "nusrat7@edujira.edu", className: "Class 7", section: "A", roll: 7005, gender: "Female", dateOfBirth: "2012-10-17", status: "approved" },

  // Class 8
  { studentId: "STD-8001", name: "Rahim Uddin", email: "rahim8@edujira.edu", className: "Class 8", section: "B", roll: 8001, gender: "Male", dateOfBirth: "2011-04-12", status: "approved" },
  { studentId: "STD-8002", name: "Sadia Jahan", email: "sadia8@edujira.edu", className: "Class 8", section: "B", roll: 8002, gender: "Female", dateOfBirth: "2011-06-25", status: "approved" },
  { studentId: "STD-8003", name: "Abrar Hossain", email: "abrar8@edujira.edu", className: "Class 8", section: "A", roll: 8003, gender: "Male", dateOfBirth: "2011-01-15", status: "approved" },
  { studentId: "STD-8004", name: "Afrin Sultana", email: "afrin8@edujira.edu", className: "Class 8", section: "B", roll: 8004, gender: "Female", dateOfBirth: "2011-10-04", status: "approved" },
  { studentId: "STD-8005", name: "Wasif Ali", email: "wasif8@edujira.edu", className: "Class 8", section: "B", roll: 8005, gender: "Male", dateOfBirth: "2011-03-03", status: "approved" },

  // Class 9
  { studentId: "STD-9001", name: "Tanvir Ahsan", email: "tanvir9@edujira.edu", className: "Class 9", section: "A", roll: 9001, gender: "Male", dateOfBirth: "2010-05-18", status: "approved" },
  { studentId: "STD-9002", name: "Fahim Ahmed", email: "fahim9@edujira.edu", className: "Class 9", section: "B", roll: 9002, gender: "Male", dateOfBirth: "2010-03-22", status: "approved" },
  { studentId: "STD-9003", name: "Tasnim Zara", email: "tasnim9@edujira.edu", className: "Class 9", section: "A", roll: 9003, gender: "Female", dateOfBirth: "2010-07-27", status: "approved" },
  { studentId: "STD-9004", name: "Lamia Islam", email: "lamia9@edujira.edu", className: "Class 9", section: "B", roll: 9004, gender: "Female", dateOfBirth: "2010-10-10", status: "approved" },
  { studentId: "STD-9005", name: "Kazi Ashfaq", email: "ashfaq@edujira.edu", className: "Class 9", section: "A", roll: 9005, gender: "Male", dateOfBirth: "2010-12-01", status: "approved" },

  // Class 10
  { studentId: "STD-10001", name: "Zarin Subah", email: "zarin10@edujira.edu", className: "Class 10", section: "A", roll: 10001, gender: "Female", dateOfBirth: "2009-12-12", status: "approved" },
  { studentId: "STD-10002", name: "Rakin Hasan", email: "rakin10@edujira.edu", className: "Class 10", section: "B", roll: 10002, gender: "Male", dateOfBirth: "2009-04-01", status: "approved" },
  { studentId: "STD-10003", name: "Humaira Akter", email: "humaira10@edujira.edu", className: "Class 10", section: "A", roll: 10003, gender: "Female", dateOfBirth: "2009-08-08", status: "approved" },
  { studentId: "STD-10004", name: "Sajid Khan", email: "sajid10@edujira.edu", className: "Class 10", section: "B", roll: 10004, gender: "Male", dateOfBirth: "2009-01-17", status: "approved" },
  { studentId: "STD-10005", name: "Tasmia Rahman", email: "tasmia10@edujira.edu", className: "Class 10", section: "A", roll: 10005, gender: "Female", dateOfBirth: "2009-06-29", status: "approved" },
];

async function seed() {
  try {
    await connectDB();

    const deleteResult = await Student.deleteMany({});
    console.log(`Cleared existing students: ${deleteResult.deletedCount} record(s) removed.`);

    const inserted = await Student.insertMany(studentsData);
    console.log(`Inserted ${inserted.length} fresh student records.`);

    const count = await Student.countDocuments();
    console.log(`Student collection now contains ${count} documents.`);
  } catch (error) {
    console.error("Failed to seed students:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

seed();
