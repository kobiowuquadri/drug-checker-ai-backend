import express from 'express'
import { checkSchema } from 'express-validator';
import { validate } from '../../validations/index.js';
import { registerController, loginController } from "../../controllers/users/authController.js";
import { registerValidation, loginValidation } from '../../validations/users/authValidations.js';

export const userRouter = express.Router()

userRouter.post('/register', validate(checkSchema(registerValidation as any)), registerController)
userRouter.post('/login', validate(checkSchema(loginValidation as any)), loginController)
