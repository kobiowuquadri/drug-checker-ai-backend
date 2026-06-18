import { Severity } from "../../constants/severity.js";

const severityOptions = Object.values(Severity);

export const createInteractionValidation = {
  drugAName: {
    in: 'body',
    isString: true,
    trim: true,
    notEmpty: {
      errorMessage: 'Drug A name is required',
    },
    errorMessage: 'Invalid drug A name',
  },
  drugBName: {
    in: 'body',
    isString: true,
    trim: true,
    notEmpty: {
      errorMessage: 'Drug B name is required',
    },
    errorMessage: 'Invalid drug B name',
  },
  drugARxcui: {
    in: 'body',
    isString: true,
    trim: true,
    notEmpty: {
      errorMessage: 'Drug A RXCUI is required',
    },
    errorMessage: 'Invalid drug A RXCUI',
  },
  drugBRxcui: {
    in: 'body',
    isString: true,
    trim: true,
    notEmpty: {
      errorMessage: 'Drug B RXCUI is required',
    },
    errorMessage: 'Invalid drug B RXCUI',
  },
  severity: {
    in: 'body',
    isIn: {
      options: [severityOptions],
      errorMessage: 'Severity must be LOW, MODERATE, or HIGH',
    },
    errorMessage: 'Invalid severity',
  },
  effect: {
    in: 'body',
    isString: true,
    trim: true,
    notEmpty: {
      errorMessage: 'Effect is required',
    },
    errorMessage: 'Invalid effect',
  },
  recommendation: {
    in: 'body',
    isString: true,
    trim: true,
    notEmpty: {
      errorMessage: 'Recommendation is required',
    },
    errorMessage: 'Invalid recommendation',
  },
  source: {
    in: 'body',
    isString: true,
    trim: true,
    notEmpty: {
      errorMessage: 'Source is required',
    },
    errorMessage: 'Invalid source',
  },
}

export const updateInteractionValidation = Object.fromEntries(
  Object.entries(createInteractionValidation).map(([key, value]) => [
    key,
    {
      ...(value as any),
      optional: true,
    },
  ])
);
