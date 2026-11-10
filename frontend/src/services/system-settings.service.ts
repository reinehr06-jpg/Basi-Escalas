import { api } from "@/lib/api";

export interface SystemSettings {
  id?: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  logRetentionDays: number;
  maxUploadLimitMB: number;
}

export const SystemSettingsService = {
  get: () => api.get<SystemSettings>("/system-settings"),
  update: (data: Partial<SystemSettings>) => api.put<SystemSettings>("/system-settings", data),
};
