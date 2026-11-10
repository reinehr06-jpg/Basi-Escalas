export interface Position {
  id: string | number;
  _id?: string;
  name?: string;
  description: string;
  responsibilities?: string[];
  church_id?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PositionPayload {
  id?: string;
  name?: string;
  description: string;
  responsibilities?: string[];
}

export interface PaginatedPositionResponse {
  current_page: number;
  data: Position[];
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

// Backward-compatibility aliases
export type Cargo = Position;
export type CargoPayload = PositionPayload;
export type PaginatedCargoResponse = PaginatedPositionResponse;
