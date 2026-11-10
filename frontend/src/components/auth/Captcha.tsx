"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: (code: string) => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "flexible";
          action?: string;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

interface CaptchaProps {
  onVerify: (token: string | null) => void;
  action?: string;
}

export function Captcha({ onVerify, action = "submit" }: CaptchaProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.endsWith(".local"));

  const siteKey = isLocal
    ? "1x00000000000000000000AA"
    : process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAAFi2uDzR6j5OZHny";

  useEffect(() => {
    let isMounted = true;

    // Em ambiente local, pré-emite o token para o formulário nunca ficar bloqueado
    if (isLocal) {
      onVerify("dev-token");
    }

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) return;

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          theme: "light",
          size: "flexible",
          callback: (token: string) => {
            if (!isMounted) return;
            setIsReady(true);
            onVerify(token);
          },
          "expired-callback": () => {
            if (!isMounted) return;
            if (!isLocal) onVerify(null);
          },
          "error-callback": (errCode: string) => {
            console.warn("[Cloudflare Turnstile] Erro:", errCode);
            if (!isMounted) return;
            if (isLocal) {
              if (containerRef.current) containerRef.current.style.display = "none";
              onVerify("dev-token");
            }
          },
        });

        widgetIdRef.current = id;
        setIsReady(true);
      } catch (err) {
        if (isLocal) onVerify("dev-token");
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const scriptId = "cf-turnstile-script";
      let script = document.getElementById(scriptId) as HTMLScriptElement;

      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (isMounted) renderWidget();
        };
        script.onerror = () => {
          if (isLocal) onVerify("dev-token");
        };
        document.head.appendChild(script);
      } else {
        const checkInterval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(checkInterval);
            if (isMounted) renderWidget();
          }
        }, 100);

        setTimeout(() => clearInterval(checkInterval), 4000);
      }
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (_) {}
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, action, onVerify, isLocal]);

  return (
    <div className="w-full flex flex-col items-center justify-center my-2">
      <div ref={containerRef} className="w-full min-h-[48px] flex items-center justify-center" />

      {!isReady && !isLocal && (
        <div className="w-full h-[48px] rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between px-4 animate-pulse">
          <div className="flex items-center gap-3">
            <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
            <span className="text-xs text-gray-500 font-medium">
              {t("Verifying security...")}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">
              {t("Security")}
            </span>
            <span className="text-[8px] text-gray-400">Cloudflare</span>
          </div>
        </div>
      )}
    </div>
  );
}
