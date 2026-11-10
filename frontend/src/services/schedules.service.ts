import { api } from "@/lib/api";
import { qs } from "@/lib/queryString";
import type {
  Candidate,
  Paginated,
  Schedule,
  ScheduleDetail,
  ScheduleSlotInput,
} from "@/types/escalas";

export interface ScheduleListParams {
  page?: number;
  itemsPerPage?: number;
  q?: string;
  event_id?: string;
  ministry_id?: string;
  status?: string;
  start?: string;
  end?: string;
}

export const SchedulesService = {
  list: (params?: ScheduleListParams) =>
    api.get<Paginated<Schedule>>(`/schedules${qs(params)}`),

  getById: (id: string) => api.get<ScheduleDetail>(`/schedules/${id}`),

  create: (data: { event_id: string; ministry_id: string; name?: string; notes?: string; slots?: ScheduleSlotInput[] }) =>
    api.post<ScheduleDetail>("/schedules", data),

  update: (
    id: string,
    data: { name?: string; notes?: string; slots?: ScheduleSlotInput[]; confirmation_deadline_at?: string },
  ) => api.put<ScheduleDetail>(`/schedules/${id}`, data),

  /** Abre as confirmações. `force` publica mesmo com vagas em aberto. */
  publish: (id: string, force = false) =>
    api.post<ScheduleDetail>(`/schedules/${id}/publish`, { force }),

  close: (id: string) => api.post<{ message: string; item: Schedule }>(`/schedules/${id}/close`, {}),

  duplicate: (id: string, eventId: string, copyVolunteers = false) =>
    api.post<ScheduleDetail>(`/schedules/${id}/duplicate`, {
      event_id: eventId,
      copy_volunteers: copyVolunteers,
    }),

  /** Candidatos para uma função, com impedimentos e alertas já explicados. */
  candidates: (id: string, functionId: string) =>
    api.get<{ data: Candidate[] }>(`/schedules/${id}/candidates${qs({ function_id: functionId })}`),

  autofill: (id: string, allowWarnings = false) =>
    api.post<ScheduleDetail>(`/schedules/${id}/autofill`, { allow_warnings: allowWarnings }),

  remove: (id: string) => api.delete<{ message: string }>(`/schedules/${id}`),
};
