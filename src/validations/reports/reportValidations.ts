export const reportGenerationValidation = {
  title: {
    in: 'body',
    optional: true,
    isString: true,
    trim: true,
    errorMessage: 'Invalid report title',
  },
  selectedDrugs: {
    in: 'body',
    isArray: {
      options: { min: 2, max: 5 },
      errorMessage: 'Selected drugs must be an array with 2 to 5 items',
    },
    errorMessage: 'Invalid selected drugs',
  },
  interactionResults: {
    in: 'body',
    isArray: true,
    errorMessage: 'Interaction results must be an array',
  },
}
