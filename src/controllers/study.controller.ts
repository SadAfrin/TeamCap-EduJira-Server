import { Request, Response } from "express";
import StudySession from "../models/StudySession.model";

export const logStudySession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, subject, durationInMinutes } = req.body;

    const newSession = new StudySession({
      studentId,
      subject,
      durationInMinutes,
    });

    await newSession.save();

    res.status(201).json({ success: true, message: "Session logged successfully", data: newSession });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error logging session" });
  }
};

export const getStudySessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const sessions = await StudySession.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error fetching sessions" });
  }
};