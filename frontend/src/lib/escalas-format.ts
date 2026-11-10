/** Formatação de datas e rótulos do domínio, no fuso do navegador. */

const DATE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const DATE_SHORT = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
const TIME = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const WEEKDAY = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });

function parse(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value?: string | null, fallback = "—") {
  const date = parse(value);
  return date ? DATE.format(date) : fallback;
}

export function formatDateTime(value?: string | null, fallback = "—") {
  const date = parse(value);
  return date ? `${DATE.format(date)} ${TIME.format(date)}` : fallback;
}

export function formatTime(value?: string | null, fallback = "—") {
  const date = parse(value);
  return date ? TIME.format(date) : fallback;
}

/** "dom, 09 nov · 19:00" — formato usado nas listas de evento. */
export function formatEventStamp(value?: string | null, fallback = "—") {
  const date = parse(value);
  if (!date) return fallback;
  const weekday = WEEKDAY.format(date).replace(".", "");
  return `${weekday}, ${DATE_SHORT.format(date).replace(".", "")} · ${TIME.format(date)}`;
}

export function toInputDateTime(value?: string | null) {
  const date = parse(value);
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toInputDate(value?: string | null) {
  const date = parse(value);
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function relativeDays(value?: string | null) {
  const date = parse(value);
  if (!date) return null;
  const diff = Math.round((date.getTime() - Date.now()) / 86_400_000);
  if (diff === 0) return "hoje";
  if (diff === 1) return "amanhã";
  if (diff === -1) return "ontem";
  return diff > 0 ? `em ${diff} dias` : `há ${Math.abs(diff)} dias`;
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  service: "Culto",
  rehearsal: "Ensaio",
  event: "Evento",
  meeting: "Reunião",
  other: "Outro",
};

export const ABSENCE_TYPE_LABELS: Record<string, string> = {
  personal: "Pessoal",
  health: "Saúde",
  travel: "Viagem",
  study: "Estudos",
  work: "Trabalho",
  other: "Outro",
};

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  coordinator: "Coordenador de escalas",
  ministry_leader: "Líder de ministério",
  volunteer: "Voluntário",
};
