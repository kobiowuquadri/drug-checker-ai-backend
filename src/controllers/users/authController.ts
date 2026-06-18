import { Request, Response } from "express";
import { registerService, loginService, refreshAccessTokenService, logoutService, getProfileService } from "../../services/users/authService.js";
import { LoginRequest, RegisterRequest, RefreshTokenRequest } from "../../types/users/auth.js";

const isProduction = process.env.NODE_ENV === 'production';

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' as const : 'lax' as const,
  maxAge,
});

const clearCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' as const : 'lax' as const,
};

const accessTokenCookieAge = 24 * 60 * 60 * 1000;
const refreshTokenCookieAge = 7 * 24 * 60 * 60 * 1000;

const setAuthCookies = (res: Response, data: any) => {
  if (data?.accessToken) {
    res.cookie('accessToken', data.accessToken, cookieOptions(accessTokenCookieAge));
  }

  if (data?.refreshToken) {
    res.cookie('refreshToken', data.refreshToken, cookieOptions(refreshTokenCookieAge));
  }
};

const clearAuthCookies = (res: Response) => {
  res.clearCookie('accessToken', clearCookieOptions);
  res.clearCookie('refreshToken', clearCookieOptions);
};

const stripTokens = (result: any) => ({
  ...result,
  data: {
    ...result.data,
    accessToken: undefined,
    refreshToken: undefined,
  },
});

export const registerController = async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
  await registerService(req.body, (result) => {
    setAuthCookies(res, result.data);
    return res.status(result.statusCode).json(stripTokens(result));
  });
};

export const loginController = async (req: Request<{}, {}, LoginRequest>, res: Response) => {
  await loginService(req.body, (result) => {
    setAuthCookies(res, result.data);
    return res.status(result.statusCode).json(stripTokens(result));
  });
};

export const refreshAccessTokenController = async (req: Request<{}, {}, RefreshTokenRequest>, res: Response) => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  await refreshAccessTokenService({ refreshToken }, (result) => {
    setAuthCookies(res, result.data);
    return res.status(result.statusCode).json(stripTokens(result));
  });
};

export const logoutController = async (req: Request, res: Response) => {
  await logoutService((req as any).user?.id, req.cookies?.refreshToken, (result) => {
    clearAuthCookies(res);
    return res.status(result.statusCode).json(result);
  });
};

export const getProfileController = async (req: Request, res: Response) => {
  await getProfileService((req as any).user.id, (result) => {
    return res.status(result.statusCode).json(result);
  });
};
