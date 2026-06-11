import { Request, Response } from "express";
import { registerService, loginService } from "../../services/users/authService.js";
import { LoginRequest, RegisterRequest } from "../../types/users/auth.js";

export const registerController = async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
  await registerService(req.body, (result) => {
    return res.status(result.statusCode).json(result);
  });
};

export const loginController = async (req: Request<{}, {}, LoginRequest>, res: Response) => {
  await loginService(req.body, (result) => {
    return res.status(result.statusCode).json(result);
  });
};



