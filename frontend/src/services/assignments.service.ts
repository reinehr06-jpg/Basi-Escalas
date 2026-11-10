import { api } from "@/lib/api";
import { qs } from "@/lib/queryString";
import type { Assignment, AssignmentRow, AttendanceStatus, Paginated, Saved } from "@/types/escalas";

export interface AssignmentListParams {
  page?: number;
  itemsPerPage?: number;
  schedule_id?: string;
  event_id?: string;
  ministry_id?: string;
  function_id?: string;
  volunteer_id?: string;
  status?: string;
  attendance_status?: string;
  from?: string;
  to?: string;
  upcoming?: boolean;
}

export const AssignmentsService = {
  list: (params?: AssignmentListParams) =>
    api.get<Paginated<AssignmentRow>>(`/assignments${qs(params)}`),

  create: (data: { schedule_id: string; function_id: string; volunteer_id: string; notes?: string }) =>
    api.post<Saved<Assignment>>("/assignments", data),

  update: (id: string, data: { function_id?: string; notes?: string }) =>
    api.put<Saved<Assignment>>(`/assignments/${id}`, data),

  remove: (id: string) => api.delete<{ message: string }>(`/assignments/${id}`),

  confirm: (id: string) => api.post<Saved<Assignment>>(`/assignments/${id}/confirm`, {}),

  decline: (id: string, reason: string) =>
    api.post<Saved<Assignment>>(`/assignments/${id}/decline`, { reason }),

  checkin: (id: string, attendance_status: AttendanceStatus, note?: string) =>
    api.post<Saved<Assignment>>(`/assignments/${id}/checkin`, { attendance_status, note }),

  bulkCheckin: (items: { assignment_id: string; attendance_status: AttendanceStatus; note?: string }[]) =>
    api.post<{ message: string; updated: number }>("/assignments/bulk-checkin", { items }),
};
