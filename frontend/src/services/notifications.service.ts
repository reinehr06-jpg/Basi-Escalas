import { api } from "@/lib/api";

export const NotificationsService = {
  getNotifications: (params?: Record<string, any>) => {
    const qs = params ? `?${new URLSearchParams(params as any).toString()}` : "";
    return api.get<any>(`/notification${qs}`);
  },
  getNotification: (id: string) => {
    return api.get<any>(`/notification/${id}`);
  },
  createNotification: (data: any) => {
    return api.post<any>('/notification', data);
  },
};

