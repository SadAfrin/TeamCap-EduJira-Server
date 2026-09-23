import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Session from "../models/Session.model";
import User from "../models/User.model";
import Admin from "../models/Admin.model";
import Teacher from "../models/Teacher.model";
import Student from "../models/Student.model";
import Parent from "../models/Parent.model";

export interface AuthUserData {
  id: string;
  _id?: any;
  name: string;
  email: string;
  role: string;
  image?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserData;
}

/**
 * Extracts session token from headers or cookies
 */
function extractToken(req: Request): string | null {
  // 1. Check Authorization Bearer Header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) return token;
  }

  // 2. Check Cookie parser output
  if (req.cookies) {
    const raw =
      req.cookies["better-auth.session_token"] ||
      req.cookies["__Secure-better-auth.session_token"];
    if (raw) {
      return typeof raw === "string" ? raw.split(".")[0] : raw;
    }
  }

  // 3. Fallback: Parse raw Cookie header string
  const rawCookieHeader = req.headers.cookie;
  if (rawCookieHeader) {
    const match = rawCookieHeader.match(
      /(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=([^;]+)/
    );
    if (match && match[1]) {
      const decoded = decodeURIComponent(match[1]);
      return decoded.split(".")[0];
    }
  }

  return null;
}

/**
 * Helper to resolve user and user role
 */
async function resolveUserFromSession(sessionToken: string): Promise<AuthUserData | null> {
  const tokenClean = sessionToken.split(".")[0].trim();

  const session = await Session.findOne({
    $or: [{ token: sessionToken }, { token: tokenClean }],
    expiresAt: { $gt: new Date() },
  });

  if (!session) return null;

  let user = null;
  if (mongoose.Types.ObjectId.isValid(session.userId)) {
    user = await User.findById(session.userId);
  }
  if (!user) {
    user = await User.findOne({
      $or: [{ id: session.userId }, { _id: session.userId }],
    });
  }

  if (!user) return null;

  let effectiveRole = (user.role || "student").toLowerCase();

  // If role is pending or default, check matching models by email
  if (effectiveRole === "pending" || !user.role) {
    const emailLower = (user.email || "").toLowerCase();
    const [isAdmin, isTeacher, isParent, isStudent] = await Promise.all([
      Admin.findOne({ email: emailLower }),
      Teacher.findOne({ email: emailLower }),
      Parent.findOne({ email: emailLower }),
      Student.findOne({ email: emailLower }),
    ]);

    if (isAdmin) effectiveRole = "admin";
    else if (isTeacher) effectiveRole = "teacher";
    else if (isParent) effectiveRole = "parent";
    else if (isStudent) effectiveRole = "student";
  }

  return {
    id: user.id || user._id?.toString(),
    _id: user._id,
    name: user.name || "User",
    email: (user.email || "").toLowerCase(),
    role: effectiveRole,
    image: user.image,
  };
}

/**
 * Middleware: Enforces authentication
 */
export async function verifyAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: No active session or token provided",
      });
      return;
    }

    const userData = await resolveUserFromSession(token);

    if (!userData) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: Session is invalid or has expired",
      });
      return;
    }

    req.user = userData;
    next();
  } catch (error: any) {
    console.error("Auth Middleware Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during authentication",
    });
  }
}

/**
 * Middleware: Role-Based Access Control (RBAC)
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: Please log in first",
      });
      return;
    }

    const normalizedUserRole = req.user.role.toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map((r) => r.toLowerCase());

    // Admin has superuser privileges or matching role
    if (normalizedUserRole === "admin" || normalizedAllowedRoles.includes(normalizedUserRole)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: `Forbidden: This action requires one of the following roles: [${allowedRoles.join(", ")}]`,
    });
  };
}

/**
 * Middleware: Optional Authentication
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);
    if (token) {
      const userData = await resolveUserFromSession(token);
      if (userData) {
        req.user = userData;
      }
    }
  } catch (error) {
    console.error("Optional Auth Error:", error);
  }
  next();
}
