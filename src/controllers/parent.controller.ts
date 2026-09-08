import { Request, Response } from "express";
import Parent from "../models/Parent.model";
import Student from "../models/Student.model";
import { buildIdOrCustomQuery } from "../lib/idHelper";

// GET /api/parents
export async function getAllParents(req: Request, res: Response) {
  try {
    const { search, status } = req.query;
    const filter: Record<string, any> = {};

    if (status && status !== "All") {
      filter.status = status;
    }
    if (search) {
      const searchRegex = new RegExp(String(search), "i");
      filter.$or = [
        { name: searchRegex },
        { parentId: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { occupation: searchRegex },
      ];
    }

    const parents = await Parent.find(filter).sort({ name: 1 });
    return res.json({ success: true, data: parents, count: parents.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch parents" });
  }
}

// GET /api/parents/:id
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

// POST /api/parents
export async function createParent(req: Request, res: Response) {
  try {
    const {
      parentId,
      name,
      email,
      phone,
      relation,
      occupation,
      children,
      address,
      preferredLanguage,
      status,
    } = req.body;

    if (!parentId || !name || !email) {
      return res.status(400).json({ success: false, message: "Parent ID, Name, and Email are required" });
    }

    const existingId = await Parent.findOne({ parentId });
    if (existingId) {
      return res.status(409).json({ success: false, message: `Parent ID "${parentId}" already exists` });
    }

    const existingEmail = await Parent.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: `Email "${email}" is already registered` });
    }

    const parent = await Parent.create({
      parentId,
      name,
      email,
      phone: phone || "",
      relation: relation || "Father",
      occupation: occupation || "",
      children: Array.isArray(children) ? children : [],
      address: address || "",
      preferredLanguage: preferredLanguage || "en",
      status: status || "Active",
    });

    return res.status(201).json({ success: true, message: "Parent created successfully", data: parent });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to create parent" });
  }
}

// PUT /api/parents/:id
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

    return res.json({ success: true, message: "Parent updated successfully", data: parent });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to update parent" });
  }
}

// DELETE /api/parents/:id
export async function deleteParent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parent = await Parent.findOneAndDelete(buildIdOrCustomQuery(id, "parentId"));

    if (!parent) {
      return res.status(404).json({ success: false, message: "Parent not found" });
    }

    return res.json({ success: true, message: "Parent deleted successfully", data: parent });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to delete parent" });
  }
}

// POST /api/parents/:id/link-child - Link child to parent
export async function linkChildToParent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { studentId, studentName } = req.body;

    if (!studentId) {
      return res.status(400).json({ success: false, message: "studentId is required" });
    }

    const student = await Student.findOne({ studentId });
    const parent = await Parent.findOneAndUpdate(
      buildIdOrCustomQuery(id, "parentId"),
      {
        $addToSet: {
          children: {
            studentId,
            studentName: studentName || student?.name || "Child",
            className: student?.className || "",
            section: student?.section || "",
          },
        },
      },
      { new: true }
    );

    if (!parent) {
      return res.status(404).json({ success: false, message: "Parent not found" });
    }

    if (student) {
      student.parentEmail = parent.email;
      student.parentName = parent.name;
      student.parentPhone = parent.phone;
      await student.save();
    }

    return res.json({ success: true, message: "Child linked to parent successfully", data: parent });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to link child" });
  }
}

// GET /api/parents/children/:email - Get children for a parent
export async function getParentChildren(req: Request, res: Response) {
  try {
    const { email } = req.params;
    const parent = await Parent.findOne({ email: String(email) });

    let children = [];
    if (parent && parent.children && parent.children.length > 0) {
      const childNamesOrIds = parent.children.map((c: any) => c.studentName || c.studentId || c);
      children = await Student.find({
        $or: [
          { name: { $in: childNamesOrIds } },
          { studentId: { $in: childNamesOrIds } },
          { parentEmail: String(email) },
        ],
      });
    } else {
      children = await Student.find({ parentEmail: String(email) });
    }

    return res.json({ success: true, data: children, count: children.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch children" });
  }
}
