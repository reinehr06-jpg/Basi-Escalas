// Máscara CPF/CNPJ: CPF = 000.000.000-00 | CNPJ = 00.000.000/0000-00
export const maskCpfCnpj = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 11) {
    // CPF
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  // CNPJ
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

// Máscara Telefone: (00) 0000-0000 ou (00) 9 0000-0000
export const maskPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{1})(\d{4})(\d{1,4})$/, '$1 $2-$3');
};

// Normaliza telefone da API para o componente PhoneInput (adiciona +)
export const normalizePhone = (p: string) => {
  if (!p) return "";
  if (p.startsWith('+')) return p;
  
  const digits = p.replace(/\D/g, '');
  if (!digits) return "";

  if (digits.length === 10 || digits.length === 11) {
    return '+55' + digits;
  }
  
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return '+' + digits;
  }
  
  return '+' + digits;
};

// Máscara CEP: 00000-000
export const maskCEP = (value: string) => {
  let v = value.replace(/\D/g, "");
  if (v.length > 8) v = v.slice(0, 8);
  if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, "$1-$2");
  return v;
};

// Máscara Cartão de Crédito: 0000 0000 0000 0000
export const maskCreditCard = (value: string) => {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
};

// Máscara Validade Cartão: MM/YY
export const maskCardExpiry = (value: string) => {
  return value
    .replace(/\D/g, "")
    .slice(0, 4)
    .replace(/(\d{2})(?=\d)/, "$1/");
};
