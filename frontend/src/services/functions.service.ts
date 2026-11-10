import { api } from "@/lib/api";
import { qs } from "@/lib/queryString";
import type { FunctionPayload, Ministry, MinistryFunction, Paginated, Saved } from "@/types/escalas";

export interface FunctionListParams {
  page?: number;
  itemsPerPage?: number;
  q?: string;
  ministry_id?: string;
  status?: string;
}

export const FunctionsService = {
  list: (params?: FunctionListParams) =>
    api.get<Paginated<MinistryFunction>>(`/functions${qs(params)}`),

  getById: (id: string) =>
    api.get<{ item: MinistryFunction; ministry: Ministry | null }>(`/functions/${id}`),

  create: (data: FunctionPayload) => api.post<Saved<MinistryFunction>>("/functions", data),

  update: (id: string, data: Partial<FunctionPayload>) =>
    api.put<Saved<MinistryFunction>>(`/functions/${id}`, data),

  remove: (id: string) => api.delete<{ message: string }>(`/functions/${id}`),
};
