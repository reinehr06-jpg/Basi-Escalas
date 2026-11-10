import { api } from "@/lib/api";
import { qs } from "@/lib/queryString";
import type { Paginated } from "@/types/escalas";

export interface AuditLog {
  id: string;
  _id: string;
  user_id?: string | null;
  user_name?: string | null;
  action: string;
  subject_type?: string | null;
  subject_id?: string | null;
  description: string;
  changes?: Record<string, unknown> | null;
  ip?: string | null;
  created_at?: string;
}

export const AuditLogsService = {
  list: (params?: { page?: number; itemsPerPage?: number; q?: string; action?: string; from?: string; to?: string }) =>
    api.get<Paginated<AuditLog>>(`/audit-logs${qs(params)}`),
};
