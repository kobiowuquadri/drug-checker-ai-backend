import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { messageHandler } from '../utils/index.js';
import { FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, UNAUTHORIZED } from '../constants/statusCode.js';

const getTokenFromHeader = (req: Request) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return null;
  }

  return authHeader.split(' ')[1] || null;
};

const getAccessToken = (req: Request) => {
  return getTokenFromHeader(req) || req.cookies?.accessToken || null;
};

const getRefreshToken = (req: Request) => {
  return req.cookies?.refreshToken || null;
};

const accessSecret = () => process.env.JWT_ACCESS_SECRET || process.env.SECRET_KEY || '';
const refreshSecret = () => process.env.JWT_REFRESH_SECRET || process.env.SECRET_KEY || '';

export const verify = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getAccessToken(req);
    
    if (!token) {
      return res.status(NOT_FOUND).json(messageHandler('Access token not found!', false, NOT_FOUND, {}));
    }
    
    jwt.verify(token, accessSecret(), (err: any, decodedToken: any) => {
      if (err) {
        return res.status(UNAUTHORIZED).json(messageHandler('Unauthorized', false, UNAUTHORIZED, {}));
      }
      
      (req as any).user = decodedToken; 
      next();
    });
  } catch (err) {
    return res.status(INTERNAL_SERVER_ERROR).json(messageHandler("Server Error", false, INTERNAL_SERVER_ERROR, {}));
  }
};

export const optionalVerify = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getAccessToken(req);

    if (token) {
      return jwt.verify(token, accessSecret(), (err: any, decodedToken: any) => {
        if (!err && decodedToken) {
          (req as any).user = decodedToken;
        }

        return next();
      });
    }

    const refreshToken = getRefreshToken(req);

    if (!refreshToken) {
      return next();
    }

    jwt.verify(refreshToken, refreshSecret(), (err: any, decodedToken: any) => {
      if (!err && decodedToken) {
        (req as any).user = decodedToken;
      }

      return next();
    });
  } catch (err) {
    return next();
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (!adminEmails.length) {
    return res.status(FORBIDDEN).json(messageHandler('Admin access is not configured', false, FORBIDDEN, {}));
  }

  const userEmail = String((req as any).user?.email || '').toLowerCase();

  if (!adminEmails.includes(userEmail)) {
    return res.status(FORBIDDEN).json(messageHandler('Admin access required', false, FORBIDDEN, {}));
  }

  return next();
};
