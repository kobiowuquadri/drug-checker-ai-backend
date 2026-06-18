import express from 'express'
import { checkSchema } from 'express-validator';
import { validate } from '../../validations/index.js';
import { checkInteractionsController } from '../../controllers/interactions/interactionController.js';
import { interactionCheckValidation } from '../../validations/interactions/interactionValidations.js';
import { optionalVerify } from '../../middlewares/auth.js';

export const interactionRouter = express.Router()

interactionRouter.post('/check', optionalVerify, validate(checkSchema(interactionCheckValidation as any)), checkInteractionsController)
