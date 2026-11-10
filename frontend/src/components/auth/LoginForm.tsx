import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { loginSchema } from "@/lib/schemas/auth.schema";
import { useTranslation } from "react-i18next";
import { AuthService } from "@/services/auth.service";

import { toast } from "sonner";
import { Captcha } from "./Captcha";

export function LoginForm({ setIsRegistering }: { setIsRegistering: (val: boolean) => void }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // Forgot password state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCaptchaToken, setForgotCaptchaToken] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Zod validation
    const result = loginSchema.safeParse({ email, password, remember, captcha: captchaToken || "" });
    if (!result.success) {
      toast.error(t("Validation error"), {
        description: result.error.issues.map(err => err.message).join(", ")
      });
      return;
    }

    try {
      const user = await login(result.data);
      const home = user?.role === "volunteer" ? "/me" : "/dashboard";

      toast.success(t("Login successful!"), {
        description: user?.role === "volunteer"
          ? "Abrindo suas escalas..."
          : t("Redirecting to dashboard..."),
      });
      router.push(home);
    } catch (err: any) {
      console.error("Login error", err);
      const rawMsg = err?.response?.data?.message || err?.message || "Login failed. Please check your credentials.";

      let localizedMsg = t(rawMsg);
      const attemptsMatch = String(rawMsg).match(/Invalid email or password!\s*(\d+)\s*attempt\(s\)\s*remaining\./i);
      if (attemptsMatch) {
        localizedMsg = `${t("Invalid email or password!")} ${attemptsMatch[1]} ${t("attempt(s) remaining.")}`;
      }
      const secondsMatch = String(rawMsg).match(/try again in\s*(\d+)\s*seconds/i);
      if (secondsMatch) {
        localizedMsg = `${t("Too many incorrect login attempts. For your security, please try again in")} ${secondsMatch[1]}s.`;
      }

      toast.error(t("Access denied"), {
        description: localizedMsg
      });
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!forgotEmail) {
      toast.error(t("Please enter your email."));
      return;
    }

    if (!forgotCaptchaToken) {
      toast.error(t("Please confirm the security verification."));
      return;
    }

    setForgotLoading(true);
    try {
      await AuthService.forgotPassword({
        email: forgotEmail,
        captchaToken: forgotCaptchaToken
      });

      setForgotSent(true);
      toast.success(t("Recovery instructions sent to your email!"));
    } catch (err: any) {
      console.error("Password recovery error", err);
      const rawMsg = err?.response?.data?.message || err?.message || "Failed to send recovery code. Please check your email or try again later.";
      toast.error(t(rawMsg));
    } finally {
      setForgotLoading(false);
    }
  };

  if (isForgotPassword) {
    return (
      <form className="fade-in" style={{ width: '100%' }} onSubmit={handleForgotSubmit}>
        <div className="card-header">
          <h1>{t("Forgot your password?")}</h1>
          <p>{t("Enter your email to receive recovery instructions.")}</p>
        </div>

        {forgotSent ? (
          <div style={{ padding: "16px 0", textAlign: "center" }}>
            <div style={{ color: "#10b981", fontSize: "15px", marginBottom: "16px" }}>
              ✓ {t("Recovery instructions sent to your email!")}
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setIsForgotPassword(false);
                setForgotSent(false);
              }}
            >
              ← {t("Back to login")}
            </button>
          </div>
        ) : (
          <>
            <div className="field">
              <label htmlFor="forgot-email">{t("Email")}</label>
              <div className="input-wrap">
                <span className="icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <Captcha onVerify={setForgotCaptchaToken} action="forgot" />

            <button
              type="submit"
              className="btn"
              disabled={forgotLoading || !forgotCaptchaToken}
              style={{ marginTop: "12px", opacity: forgotLoading || !forgotCaptchaToken ? 0.7 : 1 }}
            >
              {forgotLoading ? t("Sending...") : t("Send recovery instructions")}
            </button>

            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <a
                onClick={() => setIsForgotPassword(false)}
                style={{ cursor: 'pointer', fontSize: '14px', color: '#6366f1', textDecoration: 'none' }}
              >
                ← {t("Back to login")}
              </a>
            </div>
          </>
        )}
      </form>
    );
  }

  return (
    <form className="fade-in" style={{ width: '100%' }} onSubmit={handleLoginSubmit}>
      <div className="card-header">
        <h1>{t("Sign in to Basileia")}</h1>
        <p>{t("Access your church to continue.")}</p>
      </div>

      <div className="field">
        <label htmlFor="email">{t("Email")}</label>
        <div className="input-wrap">
          <span className="icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </span>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="password">{t("Password")}</label>
        <div className="input-wrap">
          <span className="icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <button
            type="button"
            className="toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label="Toggle password visibility"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {showPassword ? (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </>
              ) : (
                <>
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      <div className="actions">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          {t("Remember me")}
        </label>
        <button
          type="button"
          className="forgot"
          onClick={() => {
            setIsForgotPassword(true);
            setForgotEmail(email);
          }}
        >
          {t("Forgot your password?")}
        </button>
      </div>

      <Captcha onVerify={setCaptchaToken} />

      <button type="submit" className="btn">{t("Sign in to system")}</button>

      <div className="divider">
        <hr />
        <span>{t("or")}</span>
        <hr />
      </div>

      <div className="new-account">
        <span>{t("Don't have an account yet?")}</span>
        <a onClick={() => setIsRegistering(true)} style={{ cursor: 'pointer' }}>
          {t("Create account now →")}
        </a>
      </div>
    </form>
  );
}
