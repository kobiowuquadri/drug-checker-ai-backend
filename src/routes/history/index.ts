import express from 'express'
import { checkSchema } from 'express-validator';
import { validate } from '../../validations/index.js';
import { verify } from '../../middlewares/auth.js';
import { createHistoryController, deleteHistoryController, getHistoriesController, getHistoryController } from '../../controllers/history/historyController.js';
import { createHistoryValidation } from '../../validations/history/historyValidations.js';

export const historyRouter = express.Router()

historyRouter.post('/', verify, validate(checkSchema(createHistoryValidation as any)), createHistoryController)
historyRouter.get('/', verify, getHistoriesController)
historyRouter.get('/:id', verify, getHistoryController)
historyRouter.delete('/:id', verify, deleteHistoryController)
