import { api } from "@/lib/api";
import { qs } from "@/lib/queryString";
import type {
  Absence,
  Assignment,
  Availability,
  Ministry,
  MinistryFunction,
  Paginated,
  Saved,
  Skill,
  Volunteer,
  VolunteerPayload,
  VolunteerStats,
} from "@/types/escalas";

export interface VolunteerListParams {
  page?: number;
  itemsPerPage?: number;
  q?: string;
  status?: string;
  ministry_id?: string;
  function_id?: string;
  skill_id?: string;
}

export interface ImportItem {
  name: string;
  email?: string;
  phone?: string;
  external_id?: string;
  birth_date?: string;
  ministry_id?: string;
}

export const VolunteersService = {
  list: (params?: VolunteerListParams) =>
    api.get<Paginated<Volunteer>>(`/volunteers${qs(params)}`),

  getById: (id: string) =>
    api.get<{
      item: Volunteer;
      ministries: Ministry[];
      functions: MinistryFunction[];
      skills: Skill[];
      availabilities: Availability[];
      absences: Absence[];
      stats: VolunteerStats;
    }>(`/volunteers/${id}`),

  create: (data: VolunteerPayload) => api.post<Saved<Volunteer>>("/volunteers", data),

  update: (id: string, data: Partial<VolunteerPayload>) =>
    api.put<Saved<Volunteer>>(`/volunteers/${id}`, data),

  remove: (id: string) => api.delete<{ message: string }>(`/volunteers/${id}`),

  history: (id: string, params?: { page?: number; itemsPerPage?: number; from?: string; to?: string }) =>
    api.get<Paginated<Assignment>>(`/volunteers/${id}/history${qs(params)}`),

  /** Importa em lote; casa por external_id e, na falta dele, por e-mail. */
  import: (source: string, items: ImportItem[]) =>
    api.post<{ message: string; created: number; updated: number }>("/volunteers/import", {
      source,
      items,
    }),
};
