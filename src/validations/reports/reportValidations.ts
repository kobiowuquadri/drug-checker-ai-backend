import { ReportStatus } from "../../constants/reportStatus.js";

export const reportGenerationValidation = {
  historyId: {
    in: 'body',
    optional: true,
    isInt: {
      options: { min: 1 },
      errorMessage: 'History id must be a valid number',
    },
    toInt: true,
    errorMessage: 'Invalid history id',
  },
  title: {
    in: 'body',
    optional: true,
    isString: true,
    trim: true,
    errorMessage: 'Invalid report title',
  },
  notes: {
    in: 'body',
    optional: true,
    isString: true,
    trim: true,
    errorMessage: 'Invalid report notes',
  },
  selectedDrugs: {
    in: 'body',
    optional: true,
    isArray: {
      options: { min: 2, max: 5 },
      errorMessage: 'Selected drugs must be an array with 2 to 5 items',
    },
    errorMessage: 'Invalid selected drugs',
  },
  interactionResults: {
    in: 'body',
    optional: true,
    isArray: true,
    errorMessage: 'Interaction results must be an array',
  },
}

export const reportUpdateValidation = {
  title: {
    in: 'body',
    optional: true,
    isString: true,
    trim: true,
    errorMessage: 'Invalid report title',
  },
  notes: {
    in: 'body',
    optional: true,
    isString: true,
    trim: true,
    errorMessage: 'Invalid report notes',
  },
  status: {
    in: 'body',
    optional: true,
    isIn: {
      options: [Object.values(ReportStatus)],
      errorMessage: 'Status must be GENERATED, REVIEWED, or ARCHIVED',
    },
    errorMessage: 'Invalid report status',
  },
}
