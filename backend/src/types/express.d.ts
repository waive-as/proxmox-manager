import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: 'admin' | 'readonly' | 'user';
        iat: number;
        exp: number;
      };
      sessionID?: string;
    }
  }
}
