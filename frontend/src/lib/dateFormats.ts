// Grupos de países por padrão de formato de data
const MDY_COUNTRIES = new Set(['US', 'HN', 'FM', 'MH']);
const YMD_SLASH_COUNTRIES = new Set(['JP', 'TW']);
const YMD_DASH_COUNTRIES = new Set(['CN', 'KR', 'KP', 'CA', 'SE', 'LT', 'HU', 'MN']);
const DMY_DOT_COUNTRIES = new Set([
  'DE', 'AT', 'CH', 'RU', 'UA', 'BY', 'PL', 'CZ', 'SK', 'BG', 'RO',
  'RS', 'HR', 'SI', 'BA', 'MK', 'ME', 'AL', 'NO', 'FI', 'IS', 'EE',
  'LV', 'TR', 'AZ', 'GE', 'AM', 'KZ'
]);
const DMY_DASH_COUNTRIES = new Set(['NL', 'DK']);

// Mapeamento de País para Locale padrão
const COUNTRY_LOCALES: Record<string, string> = {
  PT: 'pt-PT',
  BR: 'pt-BR',
  AO: 'pt-AO',
  MZ: 'pt-MZ',
  CV: 'pt-CV',
  GW: 'pt-GW',
  ST: 'pt-ST',
  TL: 'pt-TL',
  ES: 'es-ES',
  AR: 'es-AR',
  MX: 'es-MX',
  CO: 'es-CO',
  CL: 'es-CL',
  PE: 'es-PE',
  VE: 'es-VE',
  EC: 'es-EC',
  GT: 'es-GT',
  CU: 'es-CU',
  BO: 'es-BO',
  DO: 'es-DO',
  HN: 'es-HN',
  PY: 'es-PY',
  SV: 'es-SV',
  NI: 'es-NI',
  CR: 'es-CR',
  PA: 'es-PA',
  UY: 'es-UY',
  US: 'en-US',
  GB: 'en-GB',
  CA: 'en-CA',
  AU: 'en-AU',
  NZ: 'en-NZ',
  IE: 'en-IE',
  FR: 'fr-FR',
  BE: 'fr-BE',
  DE: 'de-DE',
  AT: 'de-AT',
  CH: 'de-CH',
  IT: 'it-IT',
  NL: 'nl-NL',
  JP: 'ja-JP',
  CN: 'zh-CN',
  RU: 'ru-RU'
};

export type DateSegment = 'day' | 'month' | 'year';

export interface DateFormatConfig {
  display: string;
  model: string;
  mask: string;
  placeholder: string;
  locale: string;
  separator: string;
  order: DateSegment[];
}

/**
 * Obtém o código do país ativo salvo no navegador ou nos dados do usuário/igreja.
 */
export function getStoredCountryOrLocale(): string {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return 'BR';

  const storedCountry = localStorage.getItem('userCountry');
  if (storedCountry && storedCountry.trim()) return storedCountry.trim().toUpperCase();

  try {
    const rawUserData = localStorage.getItem('auth_user') || localStorage.getItem('userData');
    if (rawUserData) {
      const userData = JSON.parse(rawUserData);
      const country =
        userData?.address?.country ||
        userData?.church?.address?.country ||
        userData?.church_address?.country ||
        userData?.country;
      if (country) return String(country).trim().toUpperCase();

      if (userData?.preferredLanguage) {
        return resolveCountryCode(userData.preferredLanguage);
      }
    }
  } catch (e) {
    console.error('Error parsing stored user data for country detection:', e);
  }

  const userLocale = localStorage.getItem('user-locale');
  if (userLocale) return resolveCountryCode(userLocale);

  return 'BR';
}

/**
 * Resolve o código de 2 letras do país com prioridade segura e fallback Brasil ('BR').
 */
export function resolveCountryCode(countryCode?: string): string {
  const raw = countryCode || getStoredCountryOrLocale() || 'BR';
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    const normalized = trimmed.replace('_', '-');
    if (normalized.includes('-')) {
      const parts = normalized.split('-');
      if (parts[1] && parts[1].length === 2) return parts[1].toUpperCase();
      if (parts[0] && parts[0].length === 2) return parts[0].toUpperCase();
    }
    const lower = trimmed.toLowerCase();
    if (lower === 'pt') return 'PT';
    if (lower === 'br') return 'BR';
    if (lower === 'es') return 'ES';
    if (lower === 'en') return 'US';
    if (lower === 'fr') return 'FR';
    if (lower === 'de') return 'DE';
    if (lower === 'it') return 'IT';
    if (lower === 'ja') return 'JP';
    if (lower === 'zh') return 'CN';
    if (lower === 'ko') return 'KR';
    if (lower === 'ru') return 'RU';
    if (lower === 'nl') return 'NL';
    if (trimmed.length === 2) return trimmed.toUpperCase();
  }
  return 'BR';
}

/**
 * Retorna a configuração de formatação de data para o país informado.
 */
export function getDateFormat(countryCode?: string): DateFormatConfig {
  const code = resolveCountryCode(countryCode);
  const locale = COUNTRY_LOCALES[code] || `${code.toLowerCase()}-${code.toUpperCase()}`;

  if (MDY_COUNTRIES.has(code)) {
    return {
      display: 'MM/dd/yyyy',
      model: 'yyyy-MM-dd',
      mask: '##/##/####',
      placeholder: 'MM/DD/AAAA',
      locale,
      separator: '/',
      order: ['month', 'day', 'year']
    };
  }

  if (YMD_SLASH_COUNTRIES.has(code)) {
    return {
      display: 'yyyy/MM/dd',
      model: 'yyyy-MM-dd',
      mask: '####/##/##',
      placeholder: 'AAAA/MM/DD',
      locale,
      separator: '/',
      order: ['year', 'month', 'day']
    };
  }

  if (YMD_DASH_COUNTRIES.has(code)) {
    return {
      display: 'yyyy-MM-dd',
      model: 'yyyy-MM-dd',
      mask: '####-##-##',
      placeholder: 'AAAA-MM-DD',
      locale,
      separator: '-',
      order: ['year', 'month', 'day']
    };
  }

  if (DMY_DOT_COUNTRIES.has(code)) {
    return {
      display: 'dd.MM.yyyy',
      model: 'yyyy-MM-dd',
      mask: '##.##.####',
      placeholder: 'DD.MM.AAAA',
      locale,
      separator: '.',
      order: ['day', 'month', 'year']
    };
  }

  if (DMY_DASH_COUNTRIES.has(code)) {
    return {
      display: 'dd-MM-yyyy',
      model: 'yyyy-MM-dd',
      mask: '##-##-####',
      placeholder: 'DD-MM-AAAA',
      locale,
      separator: '-',
      order: ['day', 'month', 'year']
    };
  }

  // Padrão Geral (Brasil, América Latina, Portugal, Espanha, Reino Unido e resto do mundo): DD/MM/AAAA
  return {
    display: 'dd/MM/yyyy',
    model: 'yyyy-MM-dd',
    mask: '##/##/####',
    placeholder: 'DD/MM/AAAA',
    locale,
    separator: '/',
    order: ['day', 'month', 'year']
  };
}

/**
 * Formata data de negócio / manual para exibição visual no país informado.
 * IMPORTANTE: Para strings de data pura ('YYYY-MM-DD'), extrai os valores
 * diretamente via regex SEM converter para Date UTC, eliminando o erro de
 * redução de dia por fuso horário.
 */
export function formatDateForDisplay(date?: string | Date | null, countryCode?: string): string {
  if (!date) return '';

  const format = getDateFormat(countryCode);

  // Se for objeto Date diretamente (ex: new Date())
  if (date instanceof Date) {
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    return applyFormat(day, month, year, format);
  }

  const str = String(date).trim();
  if (!str) return '';

  let year: string | undefined;
  let month: string | undefined;
  let day: string | undefined;

  // Extrai de 'YYYY-MM-DD' ou 'YYYY-MM-DDTHH:mm...' diretamente SEM new Date()
  const isoMatch = str.match(/^(\d{4})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{1,2})/);
  if (isoMatch) {
    year = isoMatch[1];
    month = isoMatch[2].padStart(2, '0');
    day = isoMatch[3].padStart(2, '0');
    return applyFormat(day, month, year, format);
  }

  // Se já estiver no formato de exibição 'DD/MM/YYYY', 'MM/DD/YYYY', 'DD-MM-YYYY' ou 'DD.MM.YYYY'
  const dmyMatch = str.match(/^(\d{1,2})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{4})/);
  if (dmyMatch) {
    const p1 = dmyMatch[1].padStart(2, '0');
    const p2 = dmyMatch[2].padStart(2, '0');
    year = dmyMatch[3];

    const n1 = parseInt(p1, 10);
    const n2 = parseInt(p2, 10);

    if (n1 > 12 && n2 <= 12) {
      day = p1;
      month = p2;
    } else if (n2 > 12 && n1 <= 12) {
      day = p2;
      month = p1;
    } else {
      const isMonthFirst = format.display.startsWith('MM');
      day = isMonthFirst ? p2 : p1;
      month = isMonthFirst ? p1 : p2;
    }

    return applyFormat(day, month, year, format);
  }

  return str;
}

/**
 * Converte data de exibição visual (ex: '25/05/1990' ou '05/25/1990')
 * para o modelo de backend: 'YYYY-MM-DD'.
 */
export function formatDateForModel(date?: string | null, countryCode?: string): string {
  if (!date) return '';

  const str = String(date).trim();
  if (!str) return '';

  // Se já estiver no formato padrão de banco YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // Se for ISO completo com horário, retorna apenas os 10 primeiros caracteres (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}[T\s]/.test(str)) return str.substring(0, 10);

  const format = getDateFormat(countryCode);

  // Se tiver separadores (/ ou . ou -) com ou sem espaços
  const partsMatch = str.match(/^(\d{1,4})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{1,4})$/);
  if (partsMatch) {
    const [, p1, p2, p3] = partsMatch;
    // Ano primeiro: YYYY/MM/DD ou YYYY-MM-DD ou YYYY.MM.DD
    if (p1.length === 4) {
      return `${p1}-${p2.padStart(2, '0')}-${p3.padStart(2, '0')}`;
    }
    // Ano por último: DD/MM/YYYY ou MM/DD/YYYY
    if (p3.length === 4) {
      const n1 = parseInt(p1, 10);
      const n2 = parseInt(p2, 10);
      let day: string;
      let month: string;

      if (n1 > 12 && n2 <= 12) {
        day = p1;
        month = p2;
      } else if (n2 > 12 && n1 <= 12) {
        day = p2;
        month = p1;
      } else {
        const isMonthFirst = format.display.startsWith('MM');
        day = isMonthFirst ? p2 : p1;
        month = isMonthFirst ? p1 : p2;
      }

      return `${p3}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  // Apenas dígitos
  const cleaned = str.replace(/\D/g, '');
  if (cleaned.length === 8) {
    if (format.display.startsWith('yyyy')) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
    }
    if (format.display.startsWith('MM')) {
      return `${cleaned.slice(4, 8)}-${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}`;
    }
    return `${cleaned.slice(4, 8)}-${cleaned.slice(2, 4)}-${cleaned.slice(0, 2)}`;
  }

  return '';
}

/**
 * Formata data e hora manual/agendada para exibição (sem distorção de fuso da data).
 */
export function formatDateTimeForDisplay(isoString?: string | Date | null, countryCode?: string): string {
  if (!isoString) return '';

  if (isoString instanceof Date) {
    return formatSystemDateTimeForDisplay(isoString, countryCode);
  }

  const str = String(isoString).trim();
  if (!str) return '';

  if (str.includes('T')) {
    const [fullDate, timeWithTz] = str.split('T');
    let timePart = timeWithTz ? timeWithTz.replace(/[^\d:]/g, '').substring(0, 8) : '00:00:00';
    if (timePart.length === 0) timePart = '00:00:00';
    const formattedDate = formatDateForDisplay(fullDate, countryCode);
    return `${formattedDate} ${timePart.substring(0, 5)}`;
  }

  // Se contiver horário com separador ':' (ex: '2026-10-27 14:30:00' ou '27 / 10 / 2026 14:30')
  const spaceTimeMatch = str.match(/^(.+?)\s+(\d{1,2}:\d{2}(?::\d{2})?)/);
  if (spaceTimeMatch) {
    const [, datePart, timePart] = spaceTimeMatch;
    const formattedDate = formatDateForDisplay(datePart.trim(), countryCode);
    return `${formattedDate} ${timePart.substring(0, 5)}`;
  }

  return formatDateForDisplay(str, countryCode);
}

/**
 * Helper interno para converter timestamps do sistema para Date.
 * Garante que timestamps sem sufixo UTC (ex: '2026-10-20 19:30:00') sejam
 * interpretados como UTC do banco de dados, convertendo para a hora local do usuário.
 */
function parseSystemTimestamp(isoString: string | Date): Date {
  if (isoString instanceof Date) return isoString;
  let str = String(isoString).trim();
  if (/^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}/.test(str) && !str.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(str)) {
    str = str.replace(' ', 'T') + 'Z';
  }
  return new Date(str);
}

/**
 * Formata timestamps gerados pelo sistema (ex: created_at, updated_at).
 * Estes são salvos em UTC no servidor e DEVEM ser convertidos para o horário local do usuário.
 */
export function formatSystemDateTimeForDisplay(isoString?: string | Date | null, countryCode?: string): string {
  if (!isoString) return '';

  const dateObj = parseSystemTimestamp(isoString);
  if (isNaN(dateObj.getTime())) return '';

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = String(dateObj.getFullYear());
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');

  const format = getDateFormat(countryCode);
  const formattedDate = applyFormat(day, month, year, format);

  return `${formattedDate} ${hours}:${minutes}`;
}

/**
 * Formata apenas a data de timestamps gerados pelo sistema (ex: created_at, updated_at).
 * Converte do UTC do servidor para a data local do usuário.
 */
export function formatSystemDateForDisplay(isoString?: string | Date | null, countryCode?: string): string {
  if (!isoString) return '';

  const dateObj = parseSystemTimestamp(isoString);
  if (isNaN(dateObj.getTime())) return '';

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = String(dateObj.getFullYear());

  const format = getDateFormat(countryCode);
  return applyFormat(day, month, year, format);
}

/**
 * Converte data e hora para o modelo de backend (YYYY-MM-DD HH:mm).
 */
export function formatDateTimeForModel(displayValue?: string | null, countryCode?: string): string {
  if (!displayValue) return '';

  const str = String(displayValue).trim();
  if (str.length < 10) return '';

  const timeMatch = str.match(/\s+(\d{1,2}:\d{2}(?::\d{2})?)$/);
  if (timeMatch) {
    const timePart = timeMatch[1].substring(0, 5);
    const datePart = str.substring(0, timeMatch.index).trim();
    const formattedDate = formatDateForModel(datePart, countryCode);
    if (!formattedDate) return '';
    return `${formattedDate} ${timePart}`;
  }

  const formattedDate = formatDateForModel(str, countryCode);
  if (!formattedDate) return '';
  return `${formattedDate} 00:00`;
}

/**
 * Formata apenas a hora para exibição (HH:mm).
 */
export function formatTimeForDisplay(isoString?: string | Date | null): string {
  if (!isoString) return '';

  if (isoString instanceof Date) {
    if (isNaN(isoString.getTime())) return '';
    const hours = String(isoString.getHours()).padStart(2, '0');
    const minutes = String(isoString.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  const str = String(isoString).trim();
  if (str.includes('T')) {
    const timeWithTz = str.split('T')[1];
    if (timeWithTz) return timeWithTz.replace(/[^\d:]/g, '').substring(0, 5);
  } else if (str.includes(' ')) {
    const timePart = str.split(' ')[1];
    if (timePart) return timePart.substring(0, 5);
  }

  return '00:00';
}

export function getDateTimeMask(countryCode?: string): string {
  const dateFormat = getDateFormat(countryCode);
  return `${dateFormat.mask} ##:##`;
}

export function getDateTimePlaceholder(countryCode?: string): string {
  const dateFormat = getDateFormat(countryCode);
  return `${dateFormat.placeholder} HH:mm`;
}

export function getDateMask(countryCode?: string): string {
  const dateFormat = getDateFormat(countryCode);
  return dateFormat.mask;
}

export function getDatePlaceholder(countryCode?: string): string {
  const dateFormat = getDateFormat(countryCode);
  return dateFormat.placeholder;
}

// Helper interno para aplicar o padrão visual de data
function applyFormat(day: string, month: string, year: string, format: DateFormatConfig): string {
  switch (format.display) {
    case 'dd/MM/yyyy': return `${day}/${month}/${year}`;
    case 'dd.MM.yyyy': return `${day}.${month}.${year}`;
    case 'dd-MM-yyyy': return `${day}-${month}-${year}`;
    case 'MM/dd/yyyy': return `${month}/${day}/${year}`;
    case 'yyyy/MM/dd': return `${year}/${month}/${day}`;
    case 'yyyy-MM-dd': return `${year}-${month}-${day}`;
    default: return `${day}/${month}/${year}`;
  }
}
