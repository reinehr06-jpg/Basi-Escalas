export interface ValidationResult {
  valid: boolean;
  message: string;
}

/**
 * Validates a CPF number (11 digits) using the official check-digit algorithm.
 */
export function validateCpf(cpf: string): ValidationResult {
  const digits = cpf.replace(/\D/g, "");

  if (digits.length !== 11) {
    return { valid: false, message: "Invalid CPF: must have 11 digits." };
  }

  // Reject sequences of identical digits (e.g. 111.111.111-11)
  if (/^(\d)\1{10}$/.test(digits)) {
    return { valid: false, message: "Invalid CPF." };
  }

  // First check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) {
    return { valid: false, message: "Invalid CPF." };
  }

  // Second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[10])) {
    return { valid: false, message: "Invalid CPF." };
  }

  return { valid: true, message: "" };
}

/**
 * Validates a CNPJ number (14 digits) using the official check-digit algorithm.
 */
export function validateCnpj(cnpj: string): ValidationResult {
  const digits = cnpj.replace(/\D/g, "");

  if (digits.length !== 14) {
    return { valid: false, message: "Invalid CNPJ: must have 14 digits." };
  }

  // Reject sequences of identical digits
  if (/^(\d)\1{13}$/.test(digits)) {
    return { valid: false, message: "Invalid CNPJ." };
  }

  const calcDigit = (d: string, weights: number[]): number => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += parseInt(d[i]) * weights[i];
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  if (calcDigit(digits, weights1) !== parseInt(digits[12])) {
    return { valid: false, message: "Invalid CNPJ." };
  }
  if (calcDigit(digits, weights2) !== parseInt(digits[13])) {
    return { valid: false, message: "Invalid CNPJ." };
  }

  return { valid: true, message: "" };
}

/**
 * Auto-detects whether the value is a CPF (11 digits) or CNPJ (14 digits)
 * and validates accordingly.
 *
 * @param value - Masked or unmasked CPF or CNPJ string.
 * @returns ValidationResult with `valid` boolean and localized `message`.
 */
export function validateCpfCnpj(value: string): ValidationResult {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 0) {
    return { valid: false, message: "CPF/CNPJ is required." };
  }

  if (digits.length <= 11) {
    return validateCpf(digits);
  }

  return validateCnpj(digits);
}

