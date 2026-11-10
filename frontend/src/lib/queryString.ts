/**
 * Monta a query string ignorando valores vazios.
 * Aceita qualquer objeto de parâmetros para não obrigar cada service
 * a declarar uma index signature só por causa do tipo.
 */
export function qs(params?: object | null): string {
  if (!params) return "";

  const cleaned = Object.entries(params as Record<string, unknown>)
    .filter(([, value]) => value !== undefined && value !== null && value !== "" && value !== false)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);

  return cleaned.length ? `?${cleaned.join("&")}` : "";
}
