import { Request, Response } from "express";
import { registerService, loginService, refreshAccessTokenService, logoutService, getProfileService } from "../../services/users/authService.js";
import { LoginRequest, RegisterRequest, RefreshTokenRequest } from "../../types/users/auth.js";

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

export const refreshAccessTokenController = async (req: Request<{}, {}, RefreshTokenRequest>, res: Response) => {
  await refreshAccessTokenService(req.body, (result) => {
    return res.status(result.statusCode).json(result);
  });
};

export const logoutController = async (req: Request, res: Response) => {
  await logoutService((req as any).user.id, (result) => {
    return res.status(result.statusCode).json(result);
  });
};

export const getProfileController = async (req: Request, res: Response) => {
  await getProfileService((req as any).user.id, (result) => {
    return res.status(result.statusCode).json(result);
  });
};
