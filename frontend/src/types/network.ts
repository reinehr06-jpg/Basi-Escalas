export interface Network {
  id: string;
  name: string;
  manager_id?: string | string[];
  manager?: string;
  manager_name?: string;
  leader?: string;
  church_id?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  members_count?: number;
  cells_count?: number;
  active_cells_count?: number;
  monthly_cults_count?: number;
  qty_cells?: number;
  qty_members?: number;
  qty_visitants?: number;
  attendance_rate?: string;
}

export interface NetworkPayload {
  name: string;
  manager_id?: string | string[] | null;
  manager?: string | string[] | null;
  status?: string | null;
  deactivation_reason?: string | null;
  deactivation_description?: string | null;
}

export interface PaginatedNetworkResponse {
  current_page: number;
  data: Network[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: { url: string | null; label: string; active: boolean }[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export const qs = (params?: Record<string, any>) => {
  if (!params) return "";
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, String(value));
    }
  });
  return query.toString();
};
