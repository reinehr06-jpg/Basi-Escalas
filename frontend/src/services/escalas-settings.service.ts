import { api } from "@/lib/api";
import type { SettingRow } from "@/types/escalas";

export interface OrganizationPayload {
  name?: string;
  email?: string | null;
  phone?: string | null;
  document?: string | null;
  timezone?: string;
  locale?: string;
  logo_url?: string | null;
  address?: Record<string, unknown>;
}

export const EscalasSettingsService = {
  list: () => api.get<{ data: SettingRow[]; organization: Record<string, unknown> }>("/settings"),

  update: (settings: Record<string, unknown>) =>
    api.put<{ message: string; saved: number }>("/settings", { settings }),

  updateOrganization: (data: OrganizationPayload) =>
    api.put<{ message: string; item: Record<string, unknown> }>("/settings/organization", data),
};
