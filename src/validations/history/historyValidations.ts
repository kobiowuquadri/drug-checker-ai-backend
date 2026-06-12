export const createHistoryValidation = {
  selectedDrugs: {
    in: 'body',
    isArray: {
      options: { min: 2, max: 5 },
      errorMessage: 'Selected drugs must be an array with 2 to 5 items',
    },
    errorMessage: 'Invalid selected drugs',
  },
  results: {
    in: 'body',
    isArray: true,
    errorMessage: 'Results must be an array',
  },
}
