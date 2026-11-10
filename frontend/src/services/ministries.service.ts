import { api } from "@/lib/api";
import { qs } from "@/lib/queryString";
import type {
  Ministry,
  MinistryFunction,
  MinistryPayload,
  Paginated,
  Saved,
  Volunteer,
} from "@/types/escalas";

export interface ListParams {
  page?: number;
  itemsPerPage?: number;
  q?: string;
  status?: string;
  mine?: boolean;
}

export const MinistriesService = {
  list: (params?: ListParams) => api.get<Paginated<Ministry>>(`/ministries${qs(params)}`),

  getById: (id: string) =>
    api.get<{
      item: Ministry;
      functions: MinistryFunction[];
      leaders: Volunteer[];
      volunteers_count: number;
    }>(`/ministries/${id}`),

  create: (data: MinistryPayload) => api.post<Saved<Ministry>>("/ministries", data),

  update: (id: string, data: Partial<MinistryPayload>) =>
    api.put<Saved<Ministry>>(`/ministries/${id}`, data),

  remove: (id: string) => api.delete<{ message: string }>(`/ministries/${id}`),
};
