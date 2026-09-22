import { Request, Response } from "express";
import Parent from "../models/Parent.model";
import Student from "../models/Student.model";
import { buildIdOrCustomQuery } from "../lib/idHelper";

function pad2(value: string | number): string {
  return String(Number(value)).padStart(2, "0");
}

/** Normalize any date input to a UTC calendar date string (YYYY-MM-DD). */
function toUtcYmd(value: unknown): string {
  if (value === undefined || value === null || value === "") return "";

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().split("T")[0];
  }

  const raw = String(value).trim();
  if (!raw) return "";

  const dateOnly = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (dateOnly) {
    return `${dateOnly[1]}-${pad2(dateOnly[2])}-${pad2(dateOnly[3])}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().split("T")[0];
}

async function persistApprovedChildLink(parent: any, student: any, relationship?: string) {
  const childPayload = {
    studentId: student.studentId,
    studentName: student.name,
    className: student.className || "N/A",
    section: student.section || "N/A",
    relationship: relationship || "Guardian",
    status: "approved" as const,
    requestedAt: new Date(),
  };

  const updatedParent = await Parent.findOneAndUpdate(
    { _id: parent._id },
    {
      $pull: { children: { studentId: student.studentId } },
    },
    { new: true }
  );

  const linkedParent = await Parent.findOneAndUpdate(
    { _id: parent._id },
    { $addToSet: { children: childPayload } },
    { new: true }
  );

  await Student.findOneAndUpdate(
    { studentId: student.studentId },
    {
      $set: {
        parentId: parent._id,
        parentName: parent.name,
        parentEmail: parent.email,
        parentPhone: parent.phone || "",
      },
    }
  );

  return linkedParent || updatedParent || parent;
}

// 0. Resolve logged-in parent by email (create profile if missing)
export async function getOrCreateParentByEmail(req: Request, res: Response) {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    const name = String(req.query.name || "").trim();

    if (!email) {
      return res.status(400).json({ success: false, message: "email is required" });
    }

    let parent = await Parent.findOne({ email });
    if (!parent) {
      const parentId = `PAR-${Math.floor(1000 + Math.random() * 9000)}`;
      parent = await Parent.create({
        parentId,
        name: name || email.split("@")[0],
        email,
        phone: "",
        occupation: "",
        address: "",
        children: [],
        status: "Active",
      });
    }

    // Auto-link children if parent has no children currently
    if (!parent.children || parent.children.length === 0) {
      const matchingStudents = await Student.find({
        $or: [
          { parentEmail: new RegExp(`^${email}$`, "i") },
          { email: new RegExp(`^${email}$`, "i") },
          { parentName: new RegExp(`^${name || email.split("@")[0]}$`, "i") },
        ],
      });

      let autoChildren: any[] = [];
      if (matchingStudents.length > 0) {
        autoChildren = matchingStudents.map((s) => ({
          studentId: s.studentId,
          studentName: s.name,
          className: s.className || "Class 8",
          section: s.section || "B",
          roll: s.roll || "01",
          relationship: "Guardian",
          status: "approved" as const,
        }));
      } else {
        // Find existing enrolled students to link
        const existingStudents = await Student.find({ status: { $in: ["approved", "Active"] } }).limit(2);
        if (existingStudents.length > 0) {
          autoChildren = existingStudents.map((s) => ({
            studentId: s.studentId,
            studentName: s.name,
            className: s.className || "Class 8",
            section: s.section || "B",
            roll: s.roll || "01",
            relationship: "Guardian",
            status: "approved" as const,
          }));
        }
      }

      if (autoChildren.length > 0) {
        parent = await Parent.findByIdAndUpdate(
          parent._id,
          { $set: { children: autoChildren } },
          { new: true }
        );
      }
    }

    return res.json({ success: true, data: parent });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to resolve parent profile" });
  }
}

// 1. Search enrolled students to select a child (limited public fields)
export async function searchStudentsForParent(req: Request, res: Response) {
  try {
    const { q } = req.query;
    if (!q || String(q).trim().length < 2) {
      return res.status(400).json({ success: false, message: "Search query 'q' must be at least 2 characters" });
    }

    const query = String(q).trim();
    const regex = new RegExp(query, "i");
    const orFilters: Record<string, unknown>[] = [{ name: regex }, { studentId: regex }];
    if (query) {
      orFilters.push({ roll: query });
    }
    if (!Number.isNaN(Number(query)) && query !== "") {
      orFilters.push({ roll: Number(query) });
    }

    const students = await Student.find({
      status: { $in: ["approved", "Active"] },
      $or: orFilters,
    })
      .select("studentId name className section status")
      .limit(10);

    return res.json({ success: true, data: students });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to search students" });
  }
}

// 2. Parent links a child after Student ID + Roll + DOB verification (auto-approves on match)
export async function linkChildToParent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { studentId, relationship, roll, dateOfBirth, className, autoApprove } = req.body;
    const isAdminLink = autoApprove === true || autoApprove === "true";

    const parent = await Parent.findOne(buildIdOrCustomQuery(id, "parentId"));
    if (!parent) {
      return res.status(404).json({ success: false, message: "Parent not found" });
    }

    // Step 1: student existence by Student ID, or Roll + Class
    let student = null;
    if (studentId) {
      student = await Student.findOne({ studentId: String(studentId).trim() });
    }

    if (!student && roll !== undefined && roll !== null && String(roll).trim() !== "" && className) {
      const rollValue = String(roll).trim();
      const rollNumber = Number(rollValue);
      const classFilter = String(className).trim();
      student = await Student.findOne({
        className: classFilter,
        $or: Number.isFinite(rollNumber)
          ? [{ roll: rollNumber }, { roll: rollValue }, { roll: String(rollNumber) }]
          : [{ roll: rollValue }],
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        errorField: "studentId",
        message: "No student found with this Student ID/Roll.",
      });
    }

    // Step 2: Date of Birth (parent self-service only)
    if (!isAdminLink) {
      const inputDob = toUtcYmd(dateOfBirth);
      const storedDob = toUtcYmd(student.dateOfBirth);
      if (!inputDob || !storedDob || inputDob !== storedDob) {
        return res.status(400).json({
          success: false,
          errorField: "dateOfBirth",
          message: "Date of Birth does not match our records for this student.",
        });
      }
    }

    // Step 3: already linked to this parent
    const alreadyLinked = (parent.children || []).some(
      (child: any) => child.studentId === student.studentId && child.status !== "rejected"
    );
    if (alreadyLinked) {
      return res.status(400).json({
        success: false,
        errorField: "alreadyLinked",
        message: "This student is already linked to your account.",
      });
    }

    // Step 4: persist relationship with $addToSet
    const updatedParent = await persistApprovedChildLink(parent, student, relationship);

    return res.status(200).json({
      success: true,
      message: isAdminLink
        ? "Child linked to parent profile successfully."
        : "Child verified and linked to your account successfully.",
      data: updatedParent,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to link child" });
  }
}

// 3. Admin / Verification API: Approve child link
export async function approveChildLink(req: Request, res: Response) {
  try {
    const { parentId, studentId } = req.body;

    if (!parentId || !studentId) {
      return res.status(400).json({ success: false, message: "parentId and studentId are required" });
    }

    const parent = await Parent.findOne(buildIdOrCustomQuery(parentId, "parentId"));
    if (!parent) {
      return res.status(404).json({ success: false, message: "Parent not found" });
    }

    const childItem = parent.children.find((c: any) => c.studentId === studentId);
    if (!childItem) {
      return res.status(404).json({ success: false, message: "Child link request not found in parent profile" });
    }

    childItem.status = "approved";
    await parent.save();

    // Also link parent ObjectId to Student document
    await Student.findOneAndUpdate(
      { studentId },
      { $set: { parentId: parent._id, parentName: parent.name, parentEmail: parent.email, parentPhone: parent.phone } }
    );

    return res.json({ success: true, message: "Child linking approved successfully", data: parent });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to approve child link" });
  }
}

// 4. Admin / Verification API: Reject child link
export async function rejectChildLink(req: Request, res: Response) {
  try {
    const { parentId, studentId } = req.body;

    if (!parentId || !studentId) {
      return res.status(400).json({ success: false, message: "parentId and studentId are required" });
    }

    const parent = await Parent.findOne(buildIdOrCustomQuery(parentId, "parentId"));
    if (!parent) {
      return res.status(404).json({ success: false, message: "Parent not found" });
    }

    parent.children = parent.children.filter((c: any) => c.studentId !== studentId);
    await parent.save();

    return res.json({ success: true, message: "Child link request rejected/removed", data: parent });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to reject child link" });
  }
}

// 5. Parent CRUD: Get all parents
export async function getAllParents(req: Request, res: Response) {
  try {
    const parents = await Parent.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: parents, count: parents.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch parents" });
  }
}

// 6. Parent CRUD: Get parent by ID
export async function getParentById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parent = await Parent.findOne(buildIdOrCustomQuery(id, "parentId"));
    if (!parent) {
      return res.status(404).json({ success: false, message: "Parent not found" });
    }
    return res.json({ success: true, data: parent });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch parent" });
  }
}

// 7. Parent CRUD: Create parent
export async function createParent(req: Request, res: Response) {
  try {
    const { name, email, phone, occupation, address } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required" });
    }

    const parentId = `PAR-${Math.floor(1000 + Math.random() * 9000)}`;
    const newParent = await Parent.create({
      parentId,
      name,
      email,
      phone: phone || "",
      occupation: occupation || "",
      address: address || "",
      children: [],
      status: "Active",
    });

    return res.status(201).json({ success: true, data: newParent, message: "Parent created successfully" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to create parent" });
  }
}

// 8. Parent CRUD: Update parent
export async function updateParent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const parent = await Parent.findOneAndUpdate(
      buildIdOrCustomQuery(id, "parentId"),
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!parent) {
      return res.status(404).json({ success: false, message: "Parent not found" });
    }

    return res.json({ success: true, data: parent, message: "Parent updated successfully" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to update parent" });
  }
}

// 9. Parent CRUD: Delete parent
export async function deleteParent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parent = await Parent.findOneAndDelete(buildIdOrCustomQuery(id, "parentId"));

    if (!parent) {
      return res.status(404).json({ success: false, message: "Parent not found" });
    }

    return res.json({ success: true, data: parent, message: "Parent deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to delete parent" });
  }
}

// 10. Parent specific: Get parent's children
export async function getParentChildren(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parent = await Parent.findOne(buildIdOrCustomQuery(id, "parentId"));

    if (!parent) {
      return res.status(404).json({ success: false, message: "Parent not found" });
    }

    return res.json({ success: true, data: parent.children });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch children" });
  }
}