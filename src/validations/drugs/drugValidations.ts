export const drugSearchValidation = {
  q: {
    in: 'query',
    isString: true,
    trim: true,
    notEmpty: {
      errorMessage: 'Search query is required',
    },
    errorMessage: 'Invalid search query',
  }
}
