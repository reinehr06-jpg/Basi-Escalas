"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { AuthService } from "@/services/auth.service";
import { User, LoginPayload } from "@/types/auth";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (data: LoginPayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
  maxUploadLimitMB: number;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [maxUploadLimitMB, setMaxUploadLimitMB] = useState<number>(10);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const saveUserCountry = (userData: any) => {
    if (typeof window === "undefined" || !userData) return;
    const country =
      userData?.address?.country ||
      userData?.church?.address?.country ||
      userData?.church_address?.country ||
      userData?.country ||
      (userData?.preferredLanguage === "pt" ? "BR" : userData?.preferredLanguage === "en" ? "US" : "BR");
    if (country) {
      localStorage.setItem("userCountry", String(country).toUpperCase());
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("logged_out") === "1" || params.get("logout") === "1") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        sessionStorage.removeItem("admin_impersonating_church");
        sessionStorage.removeItem("admin_original_token");
        document.cookie = "auth_token=; path=/; max-age=0";
        document.cookie = "user_role=; path=/; max-age=0";
        setToken(null);
        setUser(null);
        setIsLoading(false);
        return;
      }
    }

    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      setToken(storedToken);
      const storedUser = localStorage.getItem("auth_user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          saveUserCountry(parsed);
        } catch (e) {
          console.warn("Failed to parse stored auth_user", e);
        }
        setIsLoading(false);
      } else {
        AuthService.me().then(res => {
          const realUser = (res as any).user ? (res as any).user : res;
          if (realUser) {
            setUser(realUser);
            localStorage.setItem("auth_user", JSON.stringify(realUser));
            saveUserCountry(realUser);
            if (realUser?.role) {
              document.cookie = `user_role=${realUser.role}; path=/; max-age=86400; SameSite=Lax`;
            }
          }
        }).catch(() => {
          setToken(null);
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
          document.cookie = "auth_token=; path=/; max-age=0";
          document.cookie = "user_role=; path=/; max-age=0";
        }).finally(() => {
          setIsLoading(false);
        });
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (data: LoginPayload) => {
    try {
      const res = await AuthService.login(data);
      const receivedToken = res?.accessToken || res?.token;
      
      if (res && (receivedToken || res.user)) {
        if (receivedToken) {
          setToken(receivedToken);
          localStorage.setItem("auth_token", receivedToken);
          document.cookie = `auth_token=${receivedToken}; path=/; max-age=86400; SameSite=Lax`;
        }

        let resolvedUser = res.user;
        if (res.maxUploadLimitMB !== undefined) {
          setMaxUploadLimitMB(Number(res.maxUploadLimitMB));
        }
        
        if (!resolvedUser) {
          const meRes = await AuthService.me();
          resolvedUser = (meRes as any).user ? (meRes as any).user : meRes;
          if ((meRes as any).maxUploadLimitMB !== undefined) {
            setMaxUploadLimitMB(Number((meRes as any).maxUploadLimitMB));
          }
        }
        
        if (!resolvedUser) {
          throw new Error("Não foi possível carregar os dados do usuário.");
        }
        
        setUser(resolvedUser);
        localStorage.setItem("auth_user", JSON.stringify(resolvedUser));
        saveUserCountry(resolvedUser);
        if (resolvedUser?.role) {
          document.cookie = `user_role=${resolvedUser.role}; path=/; max-age=86400; SameSite=Lax`;
        }
        return resolvedUser;
      }
      throw new Error("Credenciais inválidas ou usuário não retornado.");
    } catch (e) {
      console.error("Erro na autenticação:", e);
      throw e;
    }
  };

  const refreshUser = async () => {
    try {
      const meRes = await AuthService.me();
      const resolvedUser = (meRes as any).user ? (meRes as any).user : meRes;
      if (resolvedUser) {
        setUser(resolvedUser);
        localStorage.setItem("auth_user", JSON.stringify(resolvedUser));
        saveUserCountry(resolvedUser);
        if (resolvedUser?.role) {
          document.cookie = `user_role=${resolvedUser.role}; path=/; max-age=86400; SameSite=Lax`;
        }
      }
    } catch (e) {
      console.warn("Failed to refresh user", e);
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch (e) {
      console.warn("Logout request failed, cleaning local session anyway");
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    document.cookie = "auth_token=; path=/; max-age=0";
    document.cookie = "user_role=; path=/; max-age=0";
    sessionStorage.removeItem("admin_impersonating_church");
    sessionStorage.removeItem("admin_original_token");
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser, isLoading, maxUploadLimitMB }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
};
