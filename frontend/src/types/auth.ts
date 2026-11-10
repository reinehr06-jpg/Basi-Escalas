export interface User {
  id: string;
  name: string;
  fullname?: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt?: string;
  created_at?: string;
  userName?: string;
  phone?: string;
  plan_active?: boolean;
  registered_complete?: boolean;
  church_id?: string;
  nome?: string;
}

export interface LoginPayload {
  email?: string;
  userName?: string;
  password?: string;
  remember?: boolean;
  captcha?: string;
}

export interface RegisterPayload {
  country?: string;
  nome?: string;
  email?: string;
  telefone?: string;
  password?: string;
  churchName?: string;
  documentNumber?: string;
  responsibleName?: string;
  responsibleEmail?: string;
  responsiblePhone?: string;
  passwordConfirm?: string;
  captcha?: string;
}

export interface AuthResponse {
  accessToken?: string;
  token_type?: string;
  token?: string;
  user?: User;
  maxUploadLimitMB?: number;
}
