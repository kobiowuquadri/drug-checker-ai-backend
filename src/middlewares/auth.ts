import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { messageHandler } from '../utils/index.js';
import { INTERNAL_SERVER_ERROR, NOT_FOUND, UNAUTHORIZED } from '../constants/statusCode.js';

export const verify = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(NOT_FOUND).json(messageHandler('Authorization header not found!', false, NOT_FOUND, {}));
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(NOT_FOUND).json(messageHandler('Token not found!', false, NOT_FOUND, {}));
    }
    
    const secret = process.env.JWT_ACCESS_SECRET || process.env.SECRET_KEY || '';

    jwt.verify(token, secret, (err: any, decodedToken: any) => {
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
