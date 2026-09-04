import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";

export type Role = "admin" | "teacher" | "student" | "parent";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: Role;
        image?: string;
      };
    }
  }
}

/**
 * Extract Better Auth session from cookies (or Authorization) and attach req.user.
 * Safe to mount globally — does not reject unauthenticated requests by itself.
 */
export async function extractUser(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session?.user) {
      const role = ((session.user as { role?: string }).role || "student") as Role;
      req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || "",
        role,
        image: session.user.image || undefined,
      };
    }
  } catch (error) {
    console.error("extractUser session error:", error);
  }

  next();
}

/**
 * Middleware to require specific roles
 * Usage: router.post("/leave", requireRole(["parent"]), createLeaveRequest)
 */
export function requireRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "User not authenticated" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Requires one of: ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
}

/**
 * Middleware to require authentication (any logged-in user)
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "User not authenticated" });
  }
  next();
}
