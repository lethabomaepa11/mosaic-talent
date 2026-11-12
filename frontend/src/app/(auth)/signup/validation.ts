export const MAX_PASSWORD_LENGTH = 32;
export const PASSWORD_HINT = "8 to 32 characters with uppercase and lowercase letters, a number, and a symbol. No spaces.";

export const isStrongPassword = (value: string) =>
  value.length >= 8 && value.length <= MAX_PASSWORD_LENGTH && !/\s/.test(value) && /[A-Z]/.test(value) && /[a-z]/.test(value)
  && /[0-9]/.test(value) && /[^a-zA-Z0-9\s]/.test(value);
