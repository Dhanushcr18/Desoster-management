import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  body: any;
  params: any;
  query: any;
  app: any;
  headers: any;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';

    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    req.userId = decoded.userId;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expired' });
      return;
    }
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Optional auth - attaches userId if token present, but never blocks the request
export const optionalAuthenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
      const decoded = jwt.verify(token, jwtSecret) as { userId: string };
      req.userId = decoded.userId;
    }
  } catch (_) {
    // Ignore token errors for optional auth
  }
  next();
};
