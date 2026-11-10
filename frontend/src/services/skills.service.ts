import { api } from "@/lib/api";
import { qs } from "@/lib/queryString";
import type {
  MinistryFunction,
  Paginated,
  Saved,
  Skill,
  Training,
  TrainingParticipant,
  Volunteer,
} from "@/types/escalas";

export const SkillsService = {
  list: (params?: { page?: number; itemsPerPage?: number; q?: string; ministry_id?: string; category?: string; status?: string }) =>
    api.get<Paginated<Skill>>(`/skills${qs(params)}`),

  getById: (id: string) =>
    api.get<{ item: Skill; volunteers: Volunteer[]; functions: MinistryFunction[] }>(`/skills/${id}`),

  create: (data: Partial<Skill> & { name: string }) => api.post<Saved<Skill>>("/skills", data),

  update: (id: string, data: Partial<Skill>) => api.put<Saved<Skill>>(`/skills/${id}`, data),

  remove: (id: string) => api.delete<{ message: string }>(`/skills/${id}`),
};

export const TrainingsService = {
  list: (params?: { page?: number; itemsPerPage?: number; q?: string; ministry_id?: string; status?: string }) =>
    api.get<Paginated<Training>>(`/trainings${qs(params)}`),

  getById: (id: string) =>
    api.get<{ item: Training; skills: Skill[]; volunteers: Volunteer[] }>(`/trainings/${id}`),

  create: (data: Partial<Training> & { name: string; starts_at: string }) =>
    api.post<Saved<Training>>("/trainings", data),

  update: (id: string, data: Partial<Training>) => api.put<Saved<Training>>(`/trainings/${id}`, data),

  /** Concluir credita as habilidades no perfil de quem completou. */
  complete: (id: string, participants: TrainingParticipant[]) =>
    api.post<Saved<Training>>(`/trainings/${id}/complete`, { participants }),

  remove: (id: string) => api.delete<{ message: string }>(`/trainings/${id}`),
};
