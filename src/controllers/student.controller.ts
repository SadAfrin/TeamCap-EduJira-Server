import { Request, Response } from "express";
import Student from "../models/Student.model";
import Section from "../models/Section.model";
import { sendNotificationAndEmit } from "../lib/socket";
import { buildIdOrCustomQuery } from "../lib/idHelper";

// GET /api/students - List students with search, class, and section filters
export async function getAllStudents(req: Request, res: Response) {
  try {
    const { className, section, search, status } = req.query;
    const filter: Record<string, any> = {};

    if (className && className !== "All") {
      filter.className = className;
    }
    if (section && section !== "All") {
      filter.section = section;
    }
    if (status && status !== "All") {
      filter.status = status;
    }
    if (search) {
      const searchRegex = new RegExp(String(search), "i");
      filter.$or = [
        { name: searchRegex },
        { studentId: searchRegex },
        { email: searchRegex },
        { parentName: searchRegex },
      ];
    }

    const students = await Student.find(filter).sort({ createdAt: -1, className: 1, section: 1 });
    return res.json({ success: true, data: students, count: students.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch students" });
  }
}

// GET /api/students/pending - Pending registration queue for Admin
export async function getPendingStudents(req: Request, res: Response) {
  try {
    const pendingStudents = await Student.find({ status: "pending" }).sort({ createdAt: -1 });
    return res.json({ success: true, data: pendingStudents, count: pendingStudents.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch pending students" });
  }
}

// POST /api/students/register - Public Self-Registration
export async function registerStudent(req: Request, res: Response) {
  try {
    const {
      name,
      email,
      phone,
      desiredClass,
      gender,
      dateOfBirth,
      bloodGroup,
      parentName,
      parentEmail,
      parentPhone,
      address,
      previousSchool,
      previousGPA,
      documents,
    } = req.body;

    if (!name || !desiredClass) {
      return res.status(400).json({ success: false, message: "Full Name and Desired Class are required." });
    }

    if (email) {
      const existing = await Student.findOne({ email });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "An application or account with this email already exists.",
          status: existing.status,
        });
      }
    }

    // Generate unique studentId
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const studentId = `STD-${randomSuffix}`;

    const newStudent = await Student.create({
      studentId,
      name,
      email: email || "",
      phone: phone || "",
      desiredClass,
      className: "",
      section: "",
      classId: null,
      sectionId: null,
      gender: gender || "Male",
      dateOfBirth: dateOfBirth || "",
      bloodGroup: bloodGroup || "",
      parentName: parentName || "",
      parentEmail: parentEmail || "",
      parentPhone: parentPhone || "",
      address: address || "",
      previousSchool: previousSchool || "",
      previousGPA: previousGPA || "",
      documents: Array.isArray(documents) ? documents : documents ? [documents] : [],
      status: "pending",
    });

    // Notify admins of new pending application
    await sendNotificationAndEmit({
      recipientId: "admin",
      recipientRole: "admin",
      type: "system",
      title: "New Student Application",
      message: `${name} has applied for admission into ${desiredClass}.`,
      link: "/dashboard/admin/users",
    });

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully! Your application is under review by the administration.",
      data: newStudent,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Registration failed." });
  }
}

// POST /api/students/:id/approve - Admin Approve & Assign Class / Section
export async function approveStudent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { className, section, roll, classId, sectionId } = req.body;

    if (!className || !section) {
      return res.status(400).json({
        success: false,
        message: "Assigned Class and Section are required for approval.",
      });
    }

    // Validate section capacity
    if (sectionId) {
      const secDoc = await Section.findById(sectionId);
      if (secDoc && secDoc.currentCount >= secDoc.capacity) {
        return res.status(400).json({
          success: false,
          message: `Section ${secDoc.name} is full (${secDoc.currentCount}/${secDoc.capacity} capacity). Choose another section.`,
        });
      }
      if (secDoc) {
        await Section.findByIdAndUpdate(sectionId, { $inc: { currentCount: 1 } });
      }
    }

    const student = await Student.findOneAndUpdate(
      buildIdOrCustomQuery(id, "studentId"),
      {
        $set: {
          className,
          section,
          roll: roll || "01",
          classId: classId || null,
          sectionId: sectionId || null,
          status: "approved",
          rejectionReason: "",
        },
      },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: "Student application not found" });
    }

    // Send notification
    if (student.email) {
      await sendNotificationAndEmit({
        recipientId: student.email,
        recipientRole: "student",
        type: "system",
        title: "Application Approved! 🎉",
        message: `Welcome to EduJira! You have been assigned to ${className} (Section ${section}).`,
        link: "/dashboard/student",
      });
    }

    return res.json({
      success: true,
      message: `Student ${student.name} approved and assigned to ${className} - Section ${section}`,
      data: student,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to approve student" });
  }
}

// POST /api/students/:id/reject - Admin Reject with reason
export async function rejectStudent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const student = await Student.findOneAndUpdate(
      buildIdOrCustomQuery(id, "studentId"),
      {
        $set: {
          status: "rejected",
          rejectionReason: rejectionReason || "Application did not meet admission criteria.",
        },
      },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: "Student application not found" });
    }

    if (student.email) {
      await sendNotificationAndEmit({
        recipientId: student.email,
        recipientRole: "student",
        type: "system",
        title: "Application Status Update",
        message: `Your application could not be approved at this time: ${rejectionReason || "Criteria not met"}`,
        link: "/pending-review",
      });
    }

    return res.json({
      success: true,
      message: `Application for ${student.name} was rejected.`,
      data: student,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to reject application" });
  }
}

// GET /api/students/status - Check student approval status by email or ID
export async function checkStudentStatus(req: Request, res: Response) {
  try {
    const { email, studentId } = req.query;
    if (!email && !studentId) {
      return res.status(400).json({ success: false, message: "Email or studentId is required" });
    }

    const filter: Record<string, any> = {};
    if (email) filter.email = email;
    if (studentId) filter.studentId = studentId;

    const student = await Student.findOne(filter);
    if (!student) {
      return res.json({ success: true, exists: false, status: "none" });
    }

    return res.json({
      success: true,
      exists: true,
      status: student.status,
      studentId: student.studentId,
      name: student.name,
      className: student.className,
      section: student.section,
      rejectionReason: student.rejectionReason,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to check status" });
  }
}

// GET /api/students/:id
export async function getStudentById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const student = await Student.findOne(buildIdOrCustomQuery(id, "studentId"));
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    return res.json({ success: true, data: student });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch student" });
  }
}

// POST /api/students - Create new student directly by Admin
export async function createStudent(req: Request, res: Response) {
  try {
    const {
      studentId,
      name,
      className,
      section,
      roll,
      email,
      phone,
      gender,
      bloodGroup,
      parentName,
      parentEmail,
      parentPhone,
      address,
      status,
    } = req.body;

    if (!name || !className || !section) {
      return res.status(400).json({ success: false, message: "Name, Class, and Section are required" });
    }

    const sId = studentId || `STD-${Math.floor(1000 + Math.random() * 9000)}`;

    const existing = await Student.findOne({ studentId: sId });
    if (existing) {
      return res.status(409).json({ success: false, message: `Student with ID "${sId}" already exists` });
    }

    const newStudent = await Student.create({
      studentId: sId,
      name,
      className,
      section,
      roll: roll || "01",
      email: email || "",
      phone: phone || "",
      gender: gender || "Male",
      bloodGroup: bloodGroup || "",
      parentName: parentName || "",
      parentEmail: parentEmail || "",
      parentPhone: parentPhone || "",
      address: address || "",
      status: status || "approved",
    });

    return res.status(201).json({ success: true, message: "Student created successfully", data: newStudent });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to create student" });
  }
}

// PUT /api/students/:id - Update student
export async function updateStudent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const student = await Student.findOneAndUpdate(
      buildIdOrCustomQuery(id, "studentId"),
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    return res.json({ success: true, message: "Student updated successfully", data: student });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to update student" });
  }
}

// DELETE /api/students/:id - Delete student
export async function deleteStudent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const student = await Student.findOneAndDelete(buildIdOrCustomQuery(id, "studentId"));

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    return res.json({ success: true, message: "Student deleted successfully", data: student });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to delete student" });
  }
}

// GET /api/students/classes - Get unique class & section combinations
export async function getClassOptions(req: Request, res: Response) {
  try {
    const students = await Student.find({}, "className section");
    const classMap: Record<string, Set<string>> = {};

    students.forEach((s) => {
      if (s.className) {
        if (!classMap[s.className]) {
          classMap[s.className] = new Set();
        }
        if (s.section) {
          classMap[s.className].add(s.section);
        }
      }
    });

    const result = Object.entries(classMap).map(([className, sections]) => ({
      className,
      sections: Array.from(sections).sort(),
    }));

    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch class options" });
  }
}