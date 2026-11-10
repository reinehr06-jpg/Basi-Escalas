export interface Branch {
  church_name?: string;
  corporate_name?: string;
  document?: string;
  foundation_date?: string;
  id: string;
  code: string;
  type: string;
  official_name: string;
  trade_name: string;
  cnpj: string;
  opening_date: string;
  status: string;
  responsible: string;
  responsible_name?: string;
  email: string;
  phone: string;
  address: {
    country: string;
    zip_code: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    uf: string;
    latitude: string;
    longitude: string;
    isInternational: string;
    timezone: {
      zoneName: string;
    };
  };
  timezone: string;
  language: string;
  administrator: string;
  access_email: string;
  church_id: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
  status_plan?: string;
}

export interface BranchPayload {
  code?: string;
  church_name?: string;
  corporate_name?: string;
  document?: string;
  foundation_date?: string;
  type?: string;
  official_name?: string;
  trade_name?: string;
  cnpj?: string;
  opening_date?: string;
  status?: string;
  responsible?: string;
  email?: string;
  phone?: string;
  address?: Record<string, any>;
  timezone?: string;
  language?: string;
  administrator?: string;
  access_email?: string;
  deactivation_reason?: string;
  deactivation_details?: string;
}

export interface PaginatedBranchResponse {
  current_page: number;
  data: Branch[];
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
