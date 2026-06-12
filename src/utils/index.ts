import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'


// message handler
export const messageHandler = (message : string , success : boolean, statusCode : number, data : any) => {
  return { message, success, statusCode, data }
}

// hash password
export const hashPassword = async (password : string) => {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(password, salt)
}


// verify password
export const verifyPassword = async (password : string, hashedPassword : string) => {
  return await bcrypt.compare(password, hashedPassword) 
}


const getJwtSecret = (tokenType: 'access' | 'refresh' = 'access') => {
  if (tokenType === 'refresh') {
    return process.env.JWT_REFRESH_SECRET || process.env.SECRET_KEY || '';
  }

  return process.env.JWT_ACCESS_SECRET || process.env.SECRET_KEY || '';
}

// generate token
export const generateToken = (
  payload: object,
  expiresIn: jwt.SignOptions['expiresIn'] = '1d',
  tokenType: 'access' | 'refresh' = 'access'
) => {
  return jwt.sign(payload, getJwtSecret(tokenType), { expiresIn })
}


// verify token
export const verifyToken = (
  token: string,
  tokenType: 'access' | 'refresh' = 'access'
): { success: boolean; decoded?: any; error?: string } => {
  try {
    const decoded = jwt.verify(token, getJwtSecret(tokenType));
    return { success: true, decoded };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Invalid or expired token' 
    };
  }
};

// phone number validator
const COUNTRY_CODE = "234"

export const passwordValidator = (value : string) => {
  const criteria =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*!])[A-Za-z\d@#$%^&*!]{8,}$/
  const isValid = criteria.test(value)
  return isValid
}


export const verifyPhoneNumber = (phone : string) => {
  return /^(?:\+?234|0)?([789][01])\d{8}$/.test(phone);
};

export const sanitizePhoneNumber = (phone : string) => {
  if (!verifyPhoneNumber(phone)) {
    return { 
      status: false, 
      message: "Phone number is invalid", 
      phone: "" 
    };
  }

  // Remove leading 0 or +
  if (phone.startsWith("0")) {
    phone = phone.substring(1);
  }
  if (phone.startsWith("+")) {
    phone = phone.substring(1);
  }

  // Remove country code if it exists
  if (phone.startsWith(COUNTRY_CODE)) {
    phone = phone.substring(COUNTRY_CODE.length);
  }

  // Add country code with + prefix
  return {
    status: true,
    message: "Phone number is valid",
    phone: `+${COUNTRY_CODE}${phone}`
  };
};

// Generate a verification code
export const generateVerificationCode = (length = 6) => {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0');
};
