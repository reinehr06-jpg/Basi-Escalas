import { api } from "@/lib/api";
import { qs } from "@/lib/queryString";
import type { Assignment, DashboardSummary, MyDashboard, Paginated } from "@/types/escalas";

export const EscalasDashboardService = {
  summary: (params?: { from?: string; to?: string }) =>
    api.get<DashboardSummary>(`/dashboard/summary${qs(params)}`),
};

export const MeService = {
  dashboard: () => api.get<MyDashboard>("/me/dashboard"),

  assignments: (params?: { page?: number; itemsPerPage?: number; status?: string; upcoming?: boolean }) =>
    api.get<Paginated<Assignment>>(`/me/assignments${qs(params)}`),
};
