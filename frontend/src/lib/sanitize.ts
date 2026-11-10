export const sanitize = {
  digits:    (v: string) => v.replace(/\D/g, ""),
  cpfCnpj:   (v: string) => v.replace(/\D/g, ""),          // "123.456.789-00" → "12345678900"
  phone:     (v: string) => v.replace(/\D/g, ""),          // "(11) 9 1234-5678" → "11912345678"
  dialCode:  (v: string) => v.replace(/[^+\d]/g, ""),      // "+55" → "+55"  |  "+7r" → "+7"
  trim:      (v: string) => v.trim(),
};
