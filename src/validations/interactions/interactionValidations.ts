export const interactionCheckValidation = {
  drugs: {
    in: 'body',
    isArray: {
      options: { min: 2, max: 5 },
      errorMessage: 'Drugs must be an array with 2 to 5 items',
    },
    errorMessage: 'Invalid drugs',
  },
  'drugs.*.rxcui': {
    in: 'body',
    isString: true,
    trim: true,
    notEmpty: {
      errorMessage: 'Drug RXCUI is required',
    },
    errorMessage: 'Invalid drug RXCUI',
  },
  'drugs.*.name': {
    in: 'body',
    isString: true,
    trim: true,
    notEmpty: {
      errorMessage: 'Drug name is required',
    },
    errorMessage: 'Invalid drug name',
  },
}
