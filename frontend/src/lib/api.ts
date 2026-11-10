

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

// Função helper simples para pegar cookies do lado do cliente se necessário
function getCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getCookie("auth_token") || localStorage.getItem("auth_token") || localStorage.getItem("accessToken");
  
  if (process.env.NODE_ENV === "development") {
    console.group(`🌐 API ${options?.method ?? "GET"} ${path}`);
    if (options?.body) console.log("Body:", JSON.parse(options.body as string));
    console.groupEnd();
  }

  const headers: Record<string, string> = {
    "Accept": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as any || {}),
  };

  // If the body is NOT FormData and Content-Type is not explicitly provided in options, default to application/json
  if (!(options?.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  } else if (options?.body instanceof FormData) {
    // If it is FormData, ensure Content-Type is not set so the browser generates the boundary
    delete headers["Content-Type"];
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });
  
  if (res.status === 401) {
    const isLoginEndpoint = path.includes("/auth/login") || path.includes("/login");
    const isHubEndpoint = path.includes("/hub/");
    const body = await res.json().catch(() => ({}));
    
    if (!isLoginEndpoint && !isHubEndpoint) {
      if (typeof document !== 'undefined') document.cookie = 'auth_token=; Max-Age=0; path=/';
      if (typeof localStorage !== 'undefined') localStorage.removeItem("auth_token");
      if (typeof window !== 'undefined') window.location.href = "/";
      throw new Error("Sessão expirada");
    }
    
    throw new Error(body.detail || body.message || body.error || "Não autorizado");
  }

  if (res.status === 422) {
    const body = await res.json().catch(() => ({}));
    let msg = body.message;
    if (body.errors && typeof body.errors === "object") {
      const firstKey = Object.keys(body.errors)[0];
      if (firstKey && body.errors[firstKey]) {
        msg = Array.isArray(body.errors[firstKey]) ? body.errors[firstKey][0] : body.errors[firstKey];
      }
    }
    const err: any = new Error(msg || "Validation error");
    err.errors = body.errors;
    err.status = 422;
    err.response = { data: body, status: 422 };
    err.data = body;
    throw err;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    let msg = body.message;
    if (body.errors && typeof body.errors === "object") {
      const firstKey = Object.keys(body.errors)[0];
      if (firstKey && body.errors[firstKey]) {
        msg = Array.isArray(body.errors[firstKey]) ? body.errors[firstKey][0] : body.errors[firstKey];
      }
    }
    const err: any = new Error(msg || body.error || `Erro ${res.status}`);
    err.response = { data: body, status: res.status };
    err.status = res.status;
    err.data = body;
    err.errors = body.errors;
    throw err;
  }
  
  // Para respostas vazias (ex: 204 No Content no DELETE)
  if (res.status === 204) return {} as T;
  
  return res.json();
}

export const api = {
  get:    <T>(path: string) => request<T>(path),
  post:   <T>(path: string, body: unknown, options?: RequestInit) => {
    const isFormData = typeof window !== 'undefined' && body instanceof FormData;
    return request<T>(path, { method: "POST", body: isFormData ? (body as FormData) : JSON.stringify(body), ...options });
  },
  put:    <T>(path: string, body: unknown, options?: RequestInit) => {
    const isFormData = typeof window !== 'undefined' && body instanceof FormData;
    return request<T>(path, { method: "PUT", body: isFormData ? (body as FormData) : JSON.stringify(body), ...options });
  },
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
