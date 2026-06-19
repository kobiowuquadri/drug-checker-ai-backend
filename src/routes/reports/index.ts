import express from 'express'
import { checkSchema } from 'express-validator';
import { validate } from '../../validations/index.js';
import { verify } from '../../middlewares/auth.js';
import { deleteReportController, generateReportController, getReportController, getReportsController, updateReportController } from '../../controllers/reports/reportController.js';
import { reportGenerationValidation, reportUpdateValidation } from '../../validations/reports/reportValidations.js';

export const reportRouter = express.Router()

reportRouter.post('/generate', verify, validate(checkSchema(reportGenerationValidation as any)), generateReportController)
reportRouter.get('/', verify, getReportsController)
reportRouter.get('/:id', verify, getReportController)
reportRouter.patch('/:id', verify, validate(checkSchema(reportUpdateValidation as any)), updateReportController)
reportRouter.delete('/:id', verify, deleteReportController)
