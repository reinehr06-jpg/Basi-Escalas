import { api } from "@/lib/api";
import { LoginPayload, RegisterPayload, AuthResponse, User } from "@/types/auth";

export const AuthService = {
  checkAvailability: (data: { email?: string; document?: string }) => api.post<{ email_exists: boolean; document_exists: boolean }>("/auth/check-availability", data),
  login:    (data: LoginPayload)   => api.post<AuthResponse>("/auth/login", data),
  register: (data: RegisterPayload) => {
    const payload = {
      affiliate_code: typeof window !== "undefined" ? localStorage.getItem("affiliate_ref") : null,
      name: data.churchName,
      contact_name: data.responsibleName,
      email: data.responsibleEmail,
      contact_email: data.responsibleEmail,
      password: data.password,
      document: (data.documentNumber || "").replace(/\D/g, ""),
      phone: (data.responsiblePhone || "").replace("+", ""),
      telephone: (data.responsiblePhone || "").replace("+", ""),
      church_name: data.churchName,
      registered_complete: false,
      preferredLanguage: data.country === "BR" ? "pt-BR" : "en",
      address: {
        country: data.country || "BR",
        zip_code: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        uf: "",
        latitude: "",
        longitude: "",
        isInternational: data.country !== "BR",
        timezone: {
          zoneName: "",
          gmtOffset: 0,
          abbreviation: "",
          dst: "",
          countryCode: data.country || "BR",
          countryName: "",
          regionName: "",
          cityName: "",
          zoneStart: 0,
          timestamp: 0,
        },
      },
    };
    return api.post<AuthResponse>("/auth/register", payload);
  },
  logout:   ()                     => api.post<void>("/auth/logout", {}),
  me:       ()                     => api.get<User>("/auth/me"),
  forgotPassword: (data: { email: string; captchaToken?: string | null }) => api.post<{ message?: string; body?: any }>("/auth/forgot", data),
  updateProfile: (id: string, data: any) => api.put<{ message: string; user: any }>(`/users/${id}`, data),
};
