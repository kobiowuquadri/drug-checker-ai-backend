import express from 'express'
import { checkSchema } from 'express-validator';
import { validate } from '../../validations/index.js';
import { verify } from '../../middlewares/auth.js';
import { deleteReportController, generateReportController, getReportController, getReportsController } from '../../controllers/reports/reportController.js';
import { reportGenerationValidation } from '../../validations/reports/reportValidations.js';

export const reportRouter = express.Router()

reportRouter.post('/generate', verify, validate(checkSchema(reportGenerationValidation as any)), generateReportController)
reportRouter.get('/', verify, getReportsController)
reportRouter.get('/:id', verify, getReportController)
reportRouter.delete('/:id', verify, deleteReportController)
