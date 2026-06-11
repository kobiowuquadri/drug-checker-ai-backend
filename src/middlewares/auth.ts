import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export const verify = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(404).json({ success: false, message: 'Authorization header not found!' });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found!' });
    }
    
    jwt.verify(token, process.env.SECRET_KEY as string, (err: any, decodedToken: any) => {
      if (err) {
        return res.status(401).json({ auth: false, message: 'Unauthorized' });
      }
      
      (req as any).user = decodedToken; 
      next();
    });
  } catch (err) {
    return res.status(500).json({ message: "Server Error" });
  }
};
