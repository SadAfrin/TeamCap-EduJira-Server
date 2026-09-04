import { Router, Request, Response } from "express";
import { upload, getFileUrl } from "../services/fileUpload";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

/**
 * POST /api/upload
 * Upload a single file (document, medical certificate, etc.)
 * Returns: { success: true, fileUrl: "/uploads/filename" }
 */
router.post("/", requireAuth, upload.single("file"), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "No file uploaded" });
  }

  const fileUrl = getFileUrl(req.file.filename);
  res.json({ success: true, fileUrl });
});

export default router;
