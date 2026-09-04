import multer, { StorageEngine } from "multer";
import path from "path";
import fs from "fs";

// Configure upload directory
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Multer storage configuration
 * Stores files in /uploads directory with timestamped filenames
 */
const storage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // e.g., "medical_cert_1725274800000.pdf"
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${name}_${timestamp}${ext}`);
  },
});

/**
 * File filter: only allow PDFs, images, and documents
 */
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, images, and document files are allowed"));
  }
};

/**
 * Multer instance for single file upload
 * Max file size: 5MB
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/**
 * Helper function to get the URL of an uploaded file
 * Usage: const url = getFileUrl(file.filename);
 */
export function getFileUrl(filename: string): string {
  return `/uploads/${filename}`;
}

/**
 * Helper function to delete a file
 * Usage: deleteFile(filename);
 */
export function deleteFile(filename: string): void {
  try {
    const filepath = path.join(uploadDir, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch (error) {
    console.error("Error deleting file:", error);
  }
}
