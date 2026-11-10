import { api } from "@/lib/api";
import { qs } from "@/lib/queryString";
import type { Paginated } from "@/types/escalas";
import type { SystemUser } from "@/components/forms/SystemUserForm";

export const SystemUsersService = {
  list: (params?: { page?: number; itemsPerPage?: number; q?: string; role?: string; status?: string }) =>
    api.get<Paginated<SystemUser>>(`/system-users${qs(params)}`),

  getById: (id: string) =>
    api.get<{ item: SystemUser; volunteer: unknown; roles: { value: string; label: string }[] }>(
      `/system-users/${id}`,
    ),

  create: (data: Record<string, unknown>) =>
    api.post<{ message: string; item: SystemUser }>("/system-users", data),

  update: (id: string, data: Record<string, unknown>) =>
    api.put<{ message: string; item: SystemUser }>(`/system-users/${id}`, data),

  remove: (id: string) => api.delete<{ message: string }>(`/system-users/${id}`),
};
