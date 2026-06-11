import Auth from "../../schemas/users/authSchema.js";
import { generateToken, verifyPassword, hashPassword, messageHandler } from "../../utils/index.js"
import { INTERNAL_SERVER_ERROR, SUCCESS, UNAUTHORIZED, BAD_REQUEST, NOT_FOUND, CONFLICT } from "../../constants/statusCode.js"
import { RegisterRequest, RegisterResponse, LoginRequest, LoginResponse } from "../../types/users/auth.js"

export const registerService = async (data: RegisterRequest, callback: (data: RegisterResponse) => void) => {
  try {
    const { email, password } = data;

    const existingUser = await Auth.findOne({ where: { email } });
    if (existingUser) {
      return callback(messageHandler("Email already registered", false, CONFLICT, {}));
    }

    const accessToken = generateToken({ email }, '1d');
    const refreshToken = generateToken({ email }, '7d');
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const hashedPassword = await hashPassword(password);
    const user = await Auth.create({ 
      email, 
      password: hashedPassword, 
      refreshToken, 
      refreshTokenExpiresAt, createdAt: new Date(), 
      updatedAt: new Date()
    });

    return callback(messageHandler("Registration successful", true, SUCCESS, { 
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email }
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

    const accessToken = generateToken({ id: user.id, email: user.email }, '1d');
    const refreshToken = generateToken({ id: user.id, email: user.email }, '7d');
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await user.update({ refreshToken, refreshTokenExpiresAt, updatedAt: new Date() });

    return callback(messageHandler("Login successful", true, SUCCESS, {
      accessToken,
      refreshToken,
      user
    }));
  } catch (error) {
    return callback(messageHandler("An error occured while processing your login.", false, INTERNAL_SERVER_ERROR, error));
  }
};