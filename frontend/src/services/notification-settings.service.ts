import { api } from "@/lib/api";

export interface NotificationSetting {
  id: string;
  _id?: string;
  type: string;
  name?: string;
  notification_types?: string[];
  webhook_url?: string;
  token?: string;
  status: number;
  user_id: string;
  api?: string;
  default?: number;
  connectionStatus?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationPreferences {
  service: boolean;
  cell: boolean;
  course: boolean;
  event: boolean;
  birthday: boolean;
  weddingAnniversary: boolean;
  care: boolean;
  newVisitor: boolean;
}

export const NOTIFICATION_PURPOSES = [
  { key: "service", label: "Service", description: "Cult and service notifications" },
  { key: "cell", label: "Cell", description: "Cell group reminders and updates" },
  { key: "course", label: "Course", description: "Course lessons and attendance" },
  { key: "event", label: "Event", description: "Church events and announcements" },
  { key: "birthday", label: "Birthday", description: "Member birthday congratulations" },
  { key: "weddingAnniversary", label: "Wedding Anniversary", description: "Wedding anniversary greetings" },
  { key: "care", label: "Care", description: "Pastoral care and followup messages" },
  { key: "newVisitor", label: "New Visitor", description: "Welcome messages to new visitors" },
] as const;

export const NotificationSettingsService = {
  list: (params?: Record<string, any>) => {
    const qs = params ? `?${new URLSearchParams(params as any).toString()}` : "";
    return api.get<any>(`/notification-settings${qs}`);
  },

  getById: (id: string) =>
    api.get<any>(`/notification-settings/${id}`),

  create: (data: Partial<NotificationSetting>) =>
    api.post<any>("/notification-settings", data),

  update: (id: string, data: Partial<NotificationSetting>) =>
    api.put<any>(`/notification-settings/${id}`, data),

  setDefault: (id: string, type?: string) =>
    api.put<any>(`/notification-settings/${id}`, { default: 1, ...(type ? { type } : {}) }),

  remove: (id: string) =>
    api.delete<any>(`/notification-settings/${id}`),

  getTypes: () =>
    api.get<any>("/notification-settings/types"),

  getPreferences: () =>
    api.get<any>("/notification-settings/preferences/toggles"),

  updatePreferences: (data: NotificationPreferences) =>
    api.put<any>("/notification-settings/preferences/toggles", data),

  getQrCode: (method: string, id?: string, createNew?: boolean, token?: string) =>
    api.post<any>("/notification-settings/qrcode", {
      method,
      id,
      ...(createNew ? { create_new: true } : {}),
      ...(token ? { token } : {}),
    }),

  getPairCode: (method: string, phone: string, id?: string, createNew?: boolean, token?: string) =>
    api.post<any>("/notification-settings/getcode", {
      method,
      phone,
      id,
      ...(createNew ? { create_new: true } : {}),
      ...(token ? { token } : {}),
    }),

  getInstanceData: (id: string) =>
    api.get<any>(`/notification-settings/instance-data/${id}`),

  // Hub de Conexões (basile-mensageiro)
  getHubChurchId: () =>
    api.get<any>("/notification-settings/hub/church-id"),

  getSmsPairing: () =>
    api.post<any>("/notification-settings/hub/sms/pairing", {}),

  getSmsStatus: () =>
    api.get<any>("/notification-settings/hub/sms/status"),

  updateSmsSettings: (data: { chip?: number; limite_diario?: number }) =>
    api.put<any>("/notification-settings/hub/sms/settings", data),

  disconnectSms: () =>
    api.delete<any>("/notification-settings/hub/sms"),

  connectTelegram: (token: string) =>
    api.put<any>("/notification-settings/hub/telegram/connect", { token }),

  getTelegramStatus: () =>
    api.get<any>("/notification-settings/hub/telegram/status"),

  disconnectTelegram: () =>
    api.delete<any>("/notification-settings/hub/telegram"),
};
