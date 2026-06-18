import express from 'express'
import { checkSchema } from 'express-validator';
import { validate } from '../../validations/index.js';
import { registerController, loginController, refreshAccessTokenController, logoutController, getProfileController } from "../../controllers/users/authController.js";
import { registerValidation, loginValidation, refreshTokenValidation } from '../../validations/users/authValidations.js';
import { optionalVerify, verify } from '../../middlewares/auth.js';

export const userRouter = express.Router()

userRouter.post('/register', validate(checkSchema(registerValidation as any)), registerController)
userRouter.post('/login', validate(checkSchema(loginValidation as any)), loginController)
userRouter.post('/refresh-token', validate(checkSchema(refreshTokenValidation as any)), refreshAccessTokenController)
userRouter.post('/logout', optionalVerify, logoutController)
userRouter.get('/profile', verify, getProfileController)
