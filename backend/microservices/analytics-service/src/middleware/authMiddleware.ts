import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.access_token
  if (!token) return res.status(401).json({ error: "Missing auth cookie" });

  try {
    const secret = process.env.JWT_SECRET || "defaultsecret";
    const payload: any = jwt.verify(token, secret);

    req.userId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
