import express from 'express'
import { checkSchema } from 'express-validator';
import { validate } from '../../validations/index.js';
import { getDrugDetailsController, scanMedicationController, searchDrugsController } from '../../controllers/drugs/drugController.js';
import { drugSearchValidation } from '../../validations/drugs/drugValidations.js';

export const drugRouter = express.Router()

drugRouter.get('/search', validate(checkSchema(drugSearchValidation as any)), searchDrugsController)
drugRouter.post('/scan', scanMedicationController)
drugRouter.get('/:rxcui', getDrugDetailsController)
