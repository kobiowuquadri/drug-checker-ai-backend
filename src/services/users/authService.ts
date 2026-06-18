import Auth from "../../schemas/users/authSchema.js";
import { generateToken, verifyPassword, hashPassword, messageHandler, verifyToken } from "../../utils/index.js"
import { INTERNAL_SERVER_ERROR, SUCCESS, UNAUTHORIZED, BAD_REQUEST, NOT_FOUND, CONFLICT } from "../../constants/statusCode.js"
import { RegisterRequest, RegisterResponse, LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse, BaseResponse } from "../../types/users/auth.js"

const refreshTokenDays = 7;

const buildUserResponse = (user: Auth) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const buildTokens = (user: Auth) => {
  const payload = { id: user.id, email: user.email };

  return {
    accessToken: generateToken(payload, '1d', 'access'),
    refreshToken: generateToken(payload, `${refreshTokenDays}d`, 'refresh'),
    refreshTokenExpiresAt: new Date(Date.now() + refreshTokenDays * 24 * 60 * 60 * 1000)
  };
};

export const registerService = async (data: RegisterRequest, callback: (data: RegisterResponse) => void) => {
  try {
    const { name, email, password } = data;

    const existingUser = await Auth.findOne({ where: { email } });
    if (existingUser) {
      return callback(messageHandler("Email already registered", false, CONFLICT, {}));
    }

    const hashedPassword = await hashPassword(password);
    const user = await Auth.create({ 
      name,
      email, 
      password: hashedPassword,
      createdAt: new Date(), 
      updatedAt: new Date()
    });

    const tokens = buildTokens(user);
    await user.update({
      refreshToken: tokens.refreshToken,
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
      updatedAt: new Date()
    });

    return callback(messageHandler("Registration successful", true, SUCCESS, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: buildUserResponse(user)
    }));
  } catch (error) {
    return callback(messageHandler("An error occured while processing your registration.", false, INTERNAL_SERVER_ERROR, {}));
  }
};

export const loginService = async (data: LoginRequest, callback: (data: LoginResponse) => void) => {
  try {
    const { email, password } = data;

    const user = await Auth.findOne({ where: { email } });
    if (!user) {
      return callback(messageHandler("Invalid credentials", false, UNAUTHORIZED, {}));
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return callback(messageHandler("Invalid credentials", false, UNAUTHORIZED, {}));
    }

    const {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt
    } = buildTokens(user);

    await user.update({ refreshToken, refreshTokenExpiresAt, updatedAt: new Date() });

    return callback(messageHandler("Login successful", true, SUCCESS, {
      accessToken,
      refreshToken,
      user: buildUserResponse(user)
    }));
  } catch (error) {
    return callback(messageHandler("An error occured while processing your login.", false, INTERNAL_SERVER_ERROR, error));
  }
};

export const refreshAccessTokenService = async (data: RefreshTokenRequest, callback: (data: RefreshTokenResponse) => void) => {
  try {
    if (!data.refreshToken) {
      return callback(messageHandler("Refresh token is required", false, BAD_REQUEST, {}));
    }

    const tokenResult = verifyToken(data.refreshToken, 'refresh');
    if (!tokenResult.success) {
      return callback(messageHandler("Invalid refresh token", false, UNAUTHORIZED, {}));
    }

    const user = await Auth.findOne({ where: { refreshToken: data.refreshToken } });
    if (!user) {
      return callback(messageHandler("Refresh token not found", false, UNAUTHORIZED, {}));
    }

    if (user.refreshTokenExpiresAt && new Date(user.refreshTokenExpiresAt) < new Date()) {
      return callback(messageHandler("Refresh token has expired", false, UNAUTHORIZED, {}));
    }

    const {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt
    } = buildTokens(user);

    await user.update({ refreshToken, refreshTokenExpiresAt, updatedAt: new Date() });

    return callback(messageHandler("Access token refreshed successfully", true, SUCCESS, {
      accessToken,
      refreshToken,
      user: buildUserResponse(user)
    }));
  } catch (error) {
    return callback(messageHandler("An error occured while refreshing access token.", false, INTERNAL_SERVER_ERROR, error));
  }
};

export const logoutService = async (userId: number | undefined, refreshToken: string | undefined, callback: (data: BaseResponse) => void) => {
  try {
    const user = userId
      ? await Auth.findByPk(userId)
      : refreshToken
        ? await Auth.findOne({ where: { refreshToken } })
        : null;

    if (!user) {
      return callback(messageHandler("Logout successful", true, SUCCESS, {}));
    }

    await user.update({ refreshToken: '', refreshTokenExpiresAt: null as any, updatedAt: new Date() });

    return callback(messageHandler("Logout successful", true, SUCCESS, {}));
  } catch (error) {
    return callback(messageHandler("An error occured while logging out.", false, INTERNAL_SERVER_ERROR, error));
  }
};

export const getProfileService = async (userId: number, callback: (data: BaseResponse) => void) => {
  try {
    const user = await Auth.findByPk(userId);
    if (!user) {
      return callback(messageHandler("User not found", false, NOT_FOUND, {}));
    }

    return callback(messageHandler("Profile fetched successfully", true, SUCCESS, buildUserResponse(user)));
  } catch (error) {
    return callback(messageHandler("An error occured while fetching profile.", false, INTERNAL_SERVER_ERROR, error));
  }
};
