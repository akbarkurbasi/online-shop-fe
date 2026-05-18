// Email validation using regex
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Password validation - minimum 6 characters
export const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 6) {
    return {
      valid: false,
      message: 'Password must be at least 6 characters long',
    }
  }

  // Optional: Add more password strength requirements
  // - At least one uppercase letter
  // - At least one number
  // - At least one special character

  return {
    valid: true,
    message: '',
  }
}

// Name validation - minimum 2 characters
export const validateName = (name: string): { valid: boolean; message: string } => {
  const trimmedName = name.trim()

  if (trimmedName.length < 2) {
    return {
      valid: false,
      message: 'Name must be at least 2 characters long',
    }
  }

  return {
    valid: true,
    message: '',
  }
}

// Validate login form
export const validateLoginForm = (email: string, password: string): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {}

  if (!email.trim()) {
    errors.email = 'Email is required'
  } else if (!validateEmail(email)) {
    errors.email = 'Please enter a valid email address'
  }

  if (!password) {
    errors.password = 'Password is required'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

// Validate register form
export const validateRegisterForm = (
  email: string,
  password: string,
  name: string,
  confirmPassword: string
): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {}

  if (!name.trim()) {
    errors.name = 'Name is required'
  } else {
    const nameValidation = validateName(name)
    if (!nameValidation.valid) {
      errors.name = nameValidation.message
    }
  }

  if (!email.trim()) {
    errors.email = 'Email is required'
  } else if (!validateEmail(email)) {
    errors.email = 'Please enter a valid email address'
  }

  if (!password) {
    errors.password = 'Password is required'
  } else {
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.message
    }
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
