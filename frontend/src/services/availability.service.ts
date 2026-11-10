import { api } from "@/lib/api";
import { qs } from "@/lib/queryString";
import type { Absence, AbsenceRow, Availability, Paginated, Saved } from "@/types/escalas";

export interface AvailabilityInput {
  weekday: number;
  start_time?: string | null;
  end_time?: string | null;
  is_available?: boolean;
  ministry_id?: string | null;
  note?: string | null;
}

export const AvailabilityService = {
  list: (params?: { volunteer_id?: string; ministry_id?: string }) =>
    api.get<{ data: Availability[] }>(`/availabilities${qs(params)}`),

  /** Substitui a grade inteira do voluntário. */
  sync: (volunteerId: string, items: AvailabilityInput[]) =>
    api.post<{ message: string; data: Availability[] }>("/availabilities/sync", {
      volunteer_id: volunteerId,
      items,
    }),

  remove: (id: string) => api.delete<{ message: string }>(`/availabilities/${id}`),
};

export interface AbsenceListParams {
  page?: number;
  itemsPerPage?: number;
  volunteer_id?: string;
  status?: string;
  type?: string;
  mine?: boolean;
  from?: string;
  to?: string;
}

export const AbsencesService = {
  list: (params?: AbsenceListParams) => api.get<Paginated<AbsenceRow>>(`/absences${qs(params)}`),

  create: (data: {
    volunteer_id: string;
    starts_at: string;
    ends_at: string;
    reason: string;
    type?: string;
  }) => api.post<Saved<Absence>>("/absences", data),

  update: (id: string, data: Partial<{ starts_at: string; ends_at: string; reason: string; type: string }>) =>
    api.put<Saved<Absence>>(`/absences/${id}`, data),

  /** Aprovar libera automaticamente as escalações do período. */
  review: (id: string, status: "approved" | "rejected", review_note?: string) =>
    api.post<Saved<Absence>>(`/absences/${id}/review`, { status, review_note }),

  remove: (id: string) => api.delete<{ message: string }>(`/absences/${id}`),
};
