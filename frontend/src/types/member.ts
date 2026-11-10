export type MemberRole =
  | "member"
  | "disabled_member"
  | "pending_member"
  | "leader"
  | "network_manager"
  | "cell_manager"
  | "contact"
  | "member_visitant"
  | "disabled_member_visitant";

export type MemberStatus = "Active" | "Inactive" | "Pending" | "Visitor";

export type MaritalStatus =
  | "SINGLE"
  | "MARRIED"
  | "DIVORCED"
  | "SEPARATED"
  | "WIDOWED"
  | "DOMESTIC_PARTNERSHIP";

export type Gender = "M" | "F";

export interface MemberAddress {
  country?: string;
  zip_code?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  uf?: string;
  complement?: string;
  latitude?: string | number;
  longitude?: string | number;
}

export interface Member {
  id: string;
  _id?: string;
  fullname: string;
  name?: string;
  email?: string;
  phone?: string;
  cellphone?: string;
  document?: string;
  cpf?: string;
  rg?: string;
  birthday_date?: string;
  place_of_birth?: string;
  gender?: Gender;
  marital_status?: MaritalStatus;
  spouse_id?: string;
  has_children?: boolean;
  children_count?: number;
  children_ids?: string[];
  mother_name?: string;
  father_name?: string;
  marriage_date?: string;
  wedding_anniversary_date?: string;
  blood_type?: string;
  is_baptized?: boolean;
  baptized?: boolean;
  baptism_date?: string;
  accepted_jesus_date?: string;
  membered_at?: string;
  role_profile_id?: string;
  role_profile?: string;
  profile_reason?: string;
  profile_notes?: string;
  network_id?: string;
  network?: any;
  education?: string;
  profession?: string;
  is_foreign?: boolean;
  nationality?: string;
  role?: MemberRole;
  status?: MemberStatus;
  visitant?: boolean;
  engagement?: number;
  church_id?: string;
  user_id?: string;
  deactivation_reason?: string;
  deactivation_description?: string;
  address?: MemberAddress;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface MemberPayload {
  fullname: string;
  name?: string;
  birthday_date: string;
  gender: string;
  document?: string;
  cpf?: string;
  phone?: string;
  cellphone?: string;
  role?: string;
  church_id?: string;
  visitant?: boolean;
  education?: string;
  marital_status?: string;
  spouse_id?: string;
  has_children?: boolean;
  children_count?: number;
  children_ids?: string[];
  mother_name?: string;
  father_name?: string;
  marriage_date?: string;
  blood_type?: string;
  is_baptized?: boolean;
  baptized?: boolean;
  baptism_date?: string;
  accepted_jesus_date?: string;
  membered_at?: string;
  role_profile_id?: string;
  profile_reason?: string;
  profile_notes?: string;
  network_id?: string;
  place_of_birth?: string;
  profession?: string;
  is_foreign?: boolean;
  nationality?: string;
  deactivation_reason?: string;
  deactivation_description?: string;
  address?: MemberAddress;
  [key: string]: any;
}

// Backward-compatibility aliases
export type Membro = Member;
export type MembroPayload = MemberPayload;

export interface PaginatedResponse<T> {
  data: T[];
  meta?: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
  total?: number;
  current_page?: number;
  last_page?: number;
  per_page?: number;
}

export function qs(params?: Record<string, any>) {
  if (!params) return "";
  return new URLSearchParams(
    Object.entries(params).filter(
      ([_, v]) => v !== undefined && v !== null && v !== ""
    ) as string[][]
  ).toString();
}
