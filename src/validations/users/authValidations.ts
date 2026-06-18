export const registerValidation = {
    name: {
        in: 'body',
        isString: true,
        trim: true,
        notEmpty: {
            errorMessage: 'Name is required',
        },
        errorMessage: 'Invalid name',
    },
    email: {
        in: 'body',
        isEmail: true,
        errorMessage: 'Invalid email',
    },
    password: {
        in: 'body',
        isString: true,
        isLength: {
            options: { min: 8 },
            errorMessage: 'Password must be at least 8 characters long',
        },
        errorMessage: 'Invalid password',
    }
}

export const refreshTokenValidation = {
    refreshToken: {
        in: 'body',
        optional: true,
        isString: true,
        notEmpty: {
            errorMessage: 'Refresh token is required',
        },
        errorMessage: 'Invalid refresh token',
    }
}

export const loginValidation = {
    email: {
        in: 'body',
        isEmail: true,
        errorMessage: 'Invalid email',
    },
    password: {
        in: 'body',
        isString: true,
        notEmpty: {
            errorMessage: 'Password is required',
        },
        errorMessage: 'Invalid password',
    }
}
