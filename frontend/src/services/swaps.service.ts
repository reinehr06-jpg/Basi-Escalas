import { api } from "@/lib/api";
import { qs } from "@/lib/queryString";
import type {
  Assignment,
  CalendarEvent,
  Candidate,
  Paginated,
  Saved,
  SwapRequest,
  SwapRow,
  Volunteer,
} from "@/types/escalas";

export interface SwapListParams {
  page?: number;
  itemsPerPage?: number;
  status?: string;
  type?: string;
  ministry_id?: string;
  event_id?: string;
  requester_volunteer_id?: string;
  mine?: boolean;
  open_to_me?: boolean;
}

export const SwapsService = {
  list: (params?: SwapListParams) => api.get<Paginated<SwapRow>>(`/swaps${qs(params)}`),

  getById: (id: string) =>
    api.get<{
      item: SwapRequest;
      assignment: Assignment | null;
      event: CalendarEvent | null;
      requester: Volunteer | null;
      target: Volunteer | null;
    }>(`/swaps/${id}`),

  create: (data: {
    assignment_id: string;
    reason: string;
    type?: "swap" | "replacement";
    target_volunteer_id?: string;
    target_assignment_id?: string;
  }) => api.post<Saved<SwapRequest>>("/swaps", data),

  candidates: (id: string) => api.get<{ data: Candidate[] }>(`/swaps/${id}/candidates`),

  accept: (id: string, volunteerId?: string) =>
    api.post<Saved<SwapRequest>>(`/swaps/${id}/accept`, { volunteer_id: volunteerId }),

  decline: (id: string, volunteerId?: string) =>
    api.post<Saved<SwapRequest>>(`/swaps/${id}/decline`, { volunteer_id: volunteerId }),

  /** Aprovar efetiva a troca e gera a nova escalação. */
  review: (id: string, status: "approved" | "rejected", opts?: { volunteer_id?: string; review_note?: string }) =>
    api.post<Saved<SwapRequest>>(`/swaps/${id}/review`, { status, ...opts }),

  cancel: (id: string) => api.post<Saved<SwapRequest>>(`/swaps/${id}/cancel`, {}),
};
