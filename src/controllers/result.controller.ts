import { Request, Response } from "express";
import Result from "../models/Result.model";
import Student from "../models/Student.model";
import { sendNotificationAndEmit } from "../lib/socket";

export function calculateGradeAndGPA(marks: number): { grade: string; gpa: number } {
  const m = Number(marks);
  if (m >= 80) return { grade: "A+", gpa: 5.0 };
  if (m >= 70) return { grade: "A", gpa: 4.0 };
  if (m >= 60) return { grade: "A-", gpa: 3.5 };
  if (m >= 50) return { grade: "B", gpa: 3.0 };
  if (m >= 40) return { grade: "C", gpa: 2.0 };
  if (m >= 33) return { grade: "D", gpa: 1.0 };
  return { grade: "F", gpa: 0.0 };
}

// GET /api/results
export async function getAllResults(req: Request, res: Response) {
  try {
    const { studentId, className, section, term, subjectName, studentEmail } = req.query;
    const filter: Record<string, any> = {};

    if (studentId) filter.studentId = studentId;
    if (studentEmail) filter.studentEmail = studentEmail;
    if (className && className !== "All") filter.className = className;
    if (section && section !== "All") filter.section = section;
    if (term && term !== "All") filter.term = term;
    if (subjectName && subjectName !== "All") filter.subjectName = subjectName;

    const results = await Result.find(filter).sort({ createdAt: -1, subjectName: 1 });
    return res.json({ success: true, data: results, count: results.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch results" });
  }
}

// GET /api/results/transcript
export async function getStudentTranscript(req: Request, res: Response) {
  try {
    const { studentId, studentEmail, term } = req.query;
    if (!studentId && !studentEmail) {
      return res.status(400).json({ success: false, message: "studentId or studentEmail is required" });
    }

    const filter: Record<string, any> = {};
    if (studentId) filter.studentId = studentId;
    if (studentEmail) filter.studentEmail = studentEmail;
    if (term && term !== "All") filter.term = term;

    const results = await Result.find(filter);
    if (results.length === 0) {
      return res.json({
        success: true,
        data: {
          results: [],
          totalSubjects: 0,
          totalMarks: 0,
          gpa: 0,
          overallGrade: "N/A",
          finalResult: "Pending",
        },
      });
    }

    const totalMarks = results.reduce((acc, r) => acc + (r.marks || 0), 0);
    const avgMarks = totalMarks / results.length;
    const totalGPA = results.reduce((acc, r) => acc + (r.gpa || 0), 0);
    const avgGPA = Number((totalGPA / results.length).toFixed(2));
    const hasFail = results.some((r) => r.grade === "F");

    let overallGrade = "A";
    if (hasFail) overallGrade = "F";
    else if (avgGPA >= 5.0) overallGrade = "A+";
    else if (avgGPA >= 4.0) overallGrade = "A";
    else if (avgGPA >= 3.5) overallGrade = "A-";
    else if (avgGPA >= 3.0) overallGrade = "B";
    else if (avgGPA >= 2.0) overallGrade = "C";
    else if (avgGPA >= 1.0) overallGrade = "D";

    return res.json({
      success: true,
      data: {
        results,
        totalSubjects: results.length,
        totalMarks,
        averageMarks: Number(avgMarks.toFixed(1)),
        gpa: avgGPA,
        overallGrade,
        finalResult: hasFail ? "Failed" : "Passed",
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to calculate transcript" });
  }
}

// POST /api/results - Create or update single result
export async function createOrUpdateResult(req: Request, res: Response) {
  try {
    const {
      studentId,
      studentName,
      studentEmail,
      className,
      section,
      subjectName,
      subjectCode,
      term,
      marks,
      teacherRemarks,
      aiNarrativeComment,
      enteredBy,
    } = req.body;

    if (!studentId || !className || !subjectName || marks === undefined) {
      return res.status(400).json({ success: false, message: "studentId, className, subjectName, marks required" });
    }

    const { grade, gpa } = calculateGradeAndGPA(marks);

    const doc = await Result.findOneAndUpdate(
      { studentId, term: term || "Final Term", subjectName },
      {
        $set: {
          studentName: studentName || "",
          studentEmail: studentEmail || "",
          className,
          section: section || "A",
          subjectCode: subjectCode || "",
          marks: Number(marks),
          grade,
          gpa,
          teacherRemarks: teacherRemarks || "",
          aiNarrativeComment: aiNarrativeComment || "",
          enteredBy: enteredBy || "Teacher",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Notify student & parent
    if (studentEmail) {
      await sendNotificationAndEmit({
        recipientId: studentEmail,
        recipientRole: "student",
        type: "grade",
        title: `Grade Published: ${subjectName}`,
        message: `Your result for ${subjectName} (${term || "Final Term"}): ${marks}/100 (${grade} - GPA ${gpa}).`,
        link: "/dashboard/student/results",
      });
    }

    return res.status(201).json({ success: true, message: "Result saved successfully", data: doc });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to save result" });
  }
}

// POST /api/results/batch - Batch entry for whole class
export async function batchUpsertResults(req: Request, res: Response) {
  try {
    const { className, section, term, subjectName, results, enteredBy } = req.body;
    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ success: false, message: "Results array is required" });
    }

    const operations = results.map((item) => {
      const { grade, gpa } = calculateGradeAndGPA(item.marks);
      return {
        updateOne: {
          filter: {
            studentId: item.studentId,
            term: term || "Final Term",
            subjectName: subjectName || item.subjectName,
          },
          update: {
            $set: {
              studentName: item.studentName || "",
              studentEmail: item.studentEmail || "",
              className: className || item.className,
              section: section || item.section || "A",
              subjectName: subjectName || item.subjectName,
              marks: Number(item.marks),
              grade,
              gpa,
              teacherRemarks: item.teacherRemarks || "",
              aiNarrativeComment: item.aiNarrativeComment || "",
              enteredBy: enteredBy || "Teacher",
            },
          },
          upsert: true,
        },
      };
    });

    await Result.bulkWrite(operations);
    return res.json({ success: true, message: `Successfully updated ${results.length} student results.` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to batch save results" });
  }
}

// DELETE /api/results/:id
export async function deleteResult(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await Result.findByIdAndDelete(id);
    return res.json({ success: true, message: "Result deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to delete result" });
  }
}
