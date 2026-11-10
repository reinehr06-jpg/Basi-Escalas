import { api } from "@/lib/api";
import { qs } from "@/lib/queryString";
import type { CalendarEvent, EventPayload, Ministry, Paginated, Saved, Schedule } from "@/types/escalas";

export interface EventListParams {
  page?: number;
  itemsPerPage?: number;
  q?: string;
  start?: string;
  end?: string;
  type?: string;
  status?: string;
  ministry_id?: string;
  upcoming?: boolean;
  all?: boolean;
}

export const EventsService = {
  list: (params?: EventListParams) =>
    api.get<Paginated<CalendarEvent>>(`/events${qs(params)}`),

  /** Janela do calendário: devolve tudo sem paginar. */
  range: (start: string, end: string, extra?: Omit<EventListParams, "start" | "end" | "all">) =>
    api.get<{ data: CalendarEvent[] }>(`/events${qs({ ...extra, start, end, all: true })}`),

  getById: (id: string) =>
    api.get<{
      item: CalendarEvent;
      ministries: Ministry[];
      schedules: Schedule[];
      assignments_count: number;
    }>(`/events/${id}`),

  create: (data: EventPayload) => api.post<Saved<CalendarEvent>>("/events", data),

  update: (id: string, data: Partial<EventPayload> & { scope?: "single" | "series" }) =>
    api.put<Saved<CalendarEvent>>(`/events/${id}`, data),

  cancel: (id: string, reason: string, scope: "single" | "series" = "single") =>
    api.post<Saved<CalendarEvent>>(`/events/${id}/cancel`, { reason, scope }),

  remove: (id: string) => api.delete<{ message: string }>(`/events/${id}`),
};
