import express from 'express'
import { checkSchema } from 'express-validator';
import { validate } from '../../validations/index.js';
import { requireAdmin, verify } from '../../middlewares/auth.js';
import {
  createInteractionRecordController,
  deleteInteractionRecordController,
  getInteractionRecordController,
  getInteractionRecordsController,
  updateInteractionRecordController,
} from '../../controllers/admin/interactionAdminController.js';
import { createInteractionValidation, updateInteractionValidation } from '../../validations/admin/interactionAdminValidations.js';

export const adminRouter = express.Router()

adminRouter.use(verify, requireAdmin)

adminRouter.post('/interactions', validate(checkSchema(createInteractionValidation as any)), createInteractionRecordController)
adminRouter.get('/interactions', getInteractionRecordsController)
adminRouter.get('/interactions/:id', getInteractionRecordController)
adminRouter.put('/interactions/:id', validate(checkSchema(updateInteractionValidation as any)), updateInteractionRecordController)
adminRouter.delete('/interactions/:id', deleteInteractionRecordController)
