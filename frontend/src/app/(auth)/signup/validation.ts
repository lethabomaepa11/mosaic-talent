export const PASSWORD_HINT = "At least 8 characters with uppercase and lowercase letters, a number, and a symbol. No spaces.";

export const isStrongPassword = (value: string) =>
  value.length >= 8 && !/\s/.test(value) && /[A-Z]/.test(value) && /[a-z]/.test(value)
  && /[0-9]/.test(value) && /[^a-zA-Z0-9\s]/.test(value);
