import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Session from "../models/Session.model";
import User from "../models/User.model";

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
 * Extracts session token from cookies or Authorization header
 */
function extractToken(req: Request): string | null {
  // 1. Check Authorization Bearer Header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) return token;
  }

  // 2. Check Cookie (Standard or Secure HTTPS)
  if (req.cookies) {
    if (req.cookies["better-auth.session_token"]) {
      return req.cookies["better-auth.session_token"];
    }
    if (req.cookies["__Secure-better-auth.session_token"]) {
      return req.cookies["__Secure-better-auth.session_token"];
    }
  }

  return null;
}

/**
 * Middleware: Enforces user authentication
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

    // Lookup session in MongoDB
    const session = await Session.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: Session is invalid or has expired",
      });
      return;
    }

    // Lookup user associated with session
    let user = null;
    if (mongoose.Types.ObjectId.isValid(session.userId)) {
      user = await User.findById(session.userId);
    }
    if (!user) {
      user = await User.findOne({ $or: [{ id: session.userId }, { _id: session.userId }] });
    }

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: User not found",
      });
      return;
    }

    req.user = {
      id: user.id || user._id.toString(),
      _id: user._id,
      name: user.name,
      email: user.email,
      role: (user.role || "student").toLowerCase(),
      image: user.image,
    };

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
 * Admin always has access. Specified roles also have access.
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
 * Middleware: Optional Authentication (attaches req.user if present, but doesn't block guests)
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);
    if (token) {
      const session = await Session.findOne({
        token,
        expiresAt: { $gt: new Date() },
      });

      if (session) {
        let user = null;
        if (mongoose.Types.ObjectId.isValid(session.userId)) {
          user = await User.findById(session.userId);
        }
        if (!user) {
          user = await User.findOne({ $or: [{ id: session.userId }, { _id: session.userId }] });
        }

        if (user) {
          req.user = {
            id: user.id || user._id.toString(),
            _id: user._id,
            name: user.name,
            email: user.email,
            role: (user.role || "student").toLowerCase(),
            image: user.image,
          };
        }
      }
    }
  } catch (error) {
    console.error("Optional Auth Error:", error);
  }
  next();
}
