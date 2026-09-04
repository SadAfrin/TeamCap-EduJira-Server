import { Request, Response, NextFunction } from "express";

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
 * Middleware to extract user from session/JWT and attach to req.user
 * Assumes Better Auth session is available in request (cookie or header)
 * Note: In production, integrate with your actual auth provider
 */
export async function extractUser(req: Request, res: Response, next: NextFunction) {
  try {
    // TODO: Extract user from Better Auth session
    // For now, we assume the session is available in the request context
    // In a real implementation, you'd check cookies or Bearer tokens
    
    // Placeholder: you'll populate this from your auth system
    // req.user = { id: "...", email: "...", role: "teacher", ... }
    
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: "Unauthorized" });
  }
}

/**
 * Middleware to require specific roles
 * Usage: router.post("/leave", requireRole(["parent", "student"]), createLeaveRequest)
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
