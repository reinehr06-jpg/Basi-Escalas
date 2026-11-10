import React, { useState } from "react";
import { maskCpfCnpj } from "@/lib/masks";
import { validateCpfCnpj } from "@/lib/validators";
import { CountrySelect } from "./CountrySelect";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

import { Captcha } from "./Captcha";
import { registerSchema } from "@/lib/schemas/auth.schema";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { AuthService } from "@/services/auth.service";
import { useRouter } from "next/navigation";

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export function RegisterStepper({ setIsRegistering }: { setIsRegistering: (val: boolean) => void }) {
  const [registerStep, setRegisterStep] = useState(1);

  // Step 1 — Church Data
  const [country, setCountry] = useState("");
  const [churchName, setChurchName] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");

  // Step 2 — Responsible
  const [responsibleName, setResponsibleName] = useState("");
  const [responsiblePhone, setResponsiblePhone] = useState("");

  // Step 3 — Access Data
  const [responsibleEmail, setResponsibleEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegPasswordConfirm, setShowRegPasswordConfirm] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { login } = useAuth();
  const router = useRouter();

  const checkAvailability = async (field: 'email' | 'document') => {
    let checkPayload: any = {};
    if (field === 'email' && responsibleEmail.length > 5) {
      checkPayload.email = responsibleEmail;
    } else if (field === 'document' && documentNumber.replace(/\D/g, '').length >= 11) {
      checkPayload.document = documentNumber;
    } else {
      return;
    }
    try {
      const data = await AuthService.checkAvailability(checkPayload);
      setFieldErrors(prev => {
        const next = { ...prev };
        if (field === 'email') {
          if (data.email_exists) {
            next.email = "Já existe uma conta vinculada a este e-mail.";
            toast.error("E-mail em uso", { description: next.email });
          } else {
            delete next.email;
          }
        }
        if (field === 'document') {
          if (data.document_exists) {
            next.document = "Já existe uma conta vinculada a esse documento.";
            toast.error("Documento em uso", { description: next.document });
          } else {
            delete next.document;
          }
        }
        return next;
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  // Validate Step 1 → advance to Step 2
  const goToStep2 = async () => {
    let hasError = false;
    let newErrors: Record<string, string> = { ...fieldErrors };

    if (!churchName) {
      newErrors.churchName = "O nome da igreja é obrigatório.";
      hasError = true;
    }
    if (country === "BR") {
      const doc = documentNumber.replace(/\D/g, "");
      const docResult = validateCpfCnpj(documentNumber);
      if (!docResult.valid) {
        newErrors.document = docResult.message;
        hasError = true;
      } else {
        try {
          const data = await AuthService.checkAvailability({ document: doc });
          if (data.document_exists) {
            newErrors.document = "Já existe uma conta vinculada a esse documento.";
            toast.error("Documento em uso", { description: newErrors.document });
            hasError = true;
          } else {
            delete newErrors.document;
          }
        } catch (err) {
          console.error(err);
        }
      }
    }

    if (hasError) {
      setFieldErrors(newErrors);
      return;
    }
    setRegisterStep(2);
  };

  // Validate Step 2 → advance to Step 3
  const goToStep3 = () => {
    let hasError = false;
    let newErrors: Record<string, string> = {};

    if (!responsibleName) {
      newErrors.responsibleName = "Nome é obrigatório.";
      hasError = true;
    }
    if (!responsiblePhone) {
      newErrors.responsiblePhone = "Telefone é obrigatório.";
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(prev => ({ ...prev, ...newErrors }));
      return;
    }
    setRegisterStep(3);
  };

  // Validate Step 3 → submit
  const handleRegister = async () => {
    let hasError = false;
    let newErrors: Record<string, string> = { ...fieldErrors };

    if (!responsibleEmail) { 
      newErrors.email = "E-mail é obrigatório."; 
      hasError = true; 
    } else {
      try {
        const data = await AuthService.checkAvailability({ email: responsibleEmail });
        if (data.email_exists) {
          newErrors.email = "Já existe uma conta vinculada a este e-mail.";
          toast.error("E-mail em uso", { description: newErrors.email });
          hasError = true;
        } else {
          delete newErrors.email;
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (!registerPassword) { newErrors.registerPassword = "Senha é obrigatória."; hasError = true; }
    if (!registerPasswordConfirm) { newErrors.registerPasswordConfirm = "Confirmação é obrigatória."; hasError = true; }
    if (registerPassword && registerPasswordConfirm && registerPassword !== registerPasswordConfirm) {
      newErrors.registerPasswordConfirm = "Senhas não coincidem.";
      hasError = true;
    }

    if (hasError || newErrors.document) {
      setFieldErrors(newErrors);
      return;
    }

    const payload = {
      country,
      churchName,
      documentNumber,
      responsibleName,
      responsibleEmail,
      responsiblePhone,
      password: registerPassword,
      passwordConfirm: registerPasswordConfirm,
      captcha: captchaToken || ""
    };

    const result = registerSchema.safeParse(payload);
    if (!result.success) {
      // Map Zod field names → UI state keys
      const zodToUiKey: Record<string, string> = {
        password: "registerPassword",
        passwordConfirm: "registerPasswordConfirm",
        documentNumber: "document",
      };
      const zodErrors: Record<string, string> = {};
      result.error.issues.forEach(err => {
        const path = err.path[0] as string;
        const uiKey = zodToUiKey[path] || path;
        zodErrors[uiKey] = err.message;
      });
      setFieldErrors(prev => ({ ...prev, ...zodErrors }));
      return;
    }

    try {
      await AuthService.register(result.data);
      await login({ email: responsibleEmail, password: registerPassword, remember: true, captcha: captchaToken || "" });
      toast.success("Igreja cadastrada com sucesso!", { description: "Bem-vindo ao Basiléia Escalas!" });
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Erro no cadastro", err);
      let errorMsg = "Não foi possível realizar o cadastro.";
      try {
        const parsed = JSON.parse(err.message);
        errorMsg = Object.values(parsed).flat().join("\n");
      } catch (e) {
        errorMsg = err.message || errorMsg;
      }
      toast.error("Erro ao criar conta", { description: errorMsg });
    }
  };

  const stepLabel = (step: number, label: string) => {
    const isDone = registerStep > step;
    const isActive = registerStep === step;
    return (
      <div className={`step ${isActive ? 'active' : isDone ? 'done' : 'inactive'}`}>
        <div className="step-circle">{isDone ? "✓" : step}</div>
        <span style={{ fontSize: '13px', fontWeight: isActive ? 600 : 400, color: isActive ? '#7C3AED' : '#9CA3AF' }}>
          {label}
        </span>
      </div>
    );
  };

  return (
    <div className="fade-in" style={{width: '100%'}}>
      <div className="card-header" style={{ marginBottom: '8px' }}>
        <h1>Criar conta no Basileia</h1>
        <p>Cadastre sua igreja para começar a usar a plataforma.</p>
      </div>

      {/* Stepper header */}
      <div className="stepper" style={{ marginBottom: '32px' }}>
        {stepLabel(1, "Dados da igreja")}
        {stepLabel(2, "Responsável")}
        {stepLabel(3, "Acesso")}
      </div>

      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ── STEP 1: Church Data ── */}
        {registerStep === 1 && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="register-field">
              <label>País <span style={{color: '#EF4444'}}>*</span></label>
              <div style={{ position: 'relative', zIndex: 50 }}>
                <CountrySelect value={country} onChange={setCountry} />
              </div>
            </div>

            <div className="register-field">
              <label>Nome da igreja <span style={{color: '#EF4444'}}>*</span></label>
              <div className="input-wrap" style={{ borderColor: fieldErrors.churchName ? '#EF4444' : undefined, boxShadow: fieldErrors.churchName ? '0 0 0 1px #EF4444' : undefined }}>
                <input
                  type="text"
                  autoComplete="off"
                  value={churchName}
                  onChange={(e) => { setChurchName(e.target.value); setFieldErrors(p => ({...p, churchName: ""})); }}
                  placeholder="Ex: Igreja Batista"
                />
              </div>
              {fieldErrors.churchName && <span style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px", display: "block" }}>{fieldErrors.churchName}</span>}
            </div>

            {country === "BR" && (
              <div className="register-field">
                <label>CPF/CNPJ <span style={{color: '#EF4444'}}>*</span></label>
                <div className="input-wrap" style={{ borderColor: fieldErrors.document ? '#EF4444' : undefined, boxShadow: fieldErrors.document ? '0 0 0 1px #EF4444' : undefined }}>
                  <input
                    type="text"
                    autoComplete="off"
                    value={documentNumber}
                    onChange={(e) => { setDocumentNumber(maskCpfCnpj(e.target.value)); setFieldErrors(p => ({...p, document: ""})); }}
                    onBlur={() => {
                      const result = validateCpfCnpj(documentNumber);
                      if (!result.valid) {
                        setFieldErrors(p => ({...p, document: result.message}));
                        return;
                      }
                      checkAvailability('document');
                    }}
                    placeholder="00.000.000/0001-00"
                  />
                </div>
                {fieldErrors.document && <span style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px", display: "block" }}>{fieldErrors.document}</span>}
              </div>
            )}

            <button type="button" className="btn btn-register" style={{marginTop: '12px'}} onClick={goToStep2}>
              Continuar
            </button>
          </div>
        )}

        {/* ── STEP 2: Responsible ── */}
        {registerStep === 2 && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="register-field">
              <label>Nome completo do Responsável <span style={{color: '#EF4444'}}>*</span></label>
              <div className="input-wrap" style={{ borderColor: fieldErrors.responsibleName ? '#EF4444' : undefined, boxShadow: fieldErrors.responsibleName ? '0 0 0 1px #EF4444' : undefined }}>
                <input
                  type="text"
                  autoComplete="off"
                  value={responsibleName}
                  onChange={(e) => { setResponsibleName(e.target.value); setFieldErrors(p => ({...p, responsibleName: ""})); }}
                  placeholder="Nome do responsável pela conta"
                />
              </div>
              {fieldErrors.responsibleName && <span style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px", display: "block" }}>{fieldErrors.responsibleName}</span>}
            </div>

            <div className="register-field">
              <label>Telefone do Responsável <span style={{color: '#EF4444'}}>*</span></label>
              <div>
                <PhoneInput
                  international={false}
                  defaultCountry={country as any}
                  initialValueFormat="national"
                  value={responsiblePhone}
                  onChange={(val: any) => { setResponsiblePhone(val || ""); setFieldErrors(p => ({...p, responsiblePhone: ""})); }}
                  className="flex h-[50px] w-full rounded-[12px] border text-[14px] text-gray-900 shadow-sm transition-colors focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-200"
                  style={{ padding: '0 16px', borderColor: fieldErrors.responsiblePhone ? '#EF4444' : '#E5E7EB', boxShadow: fieldErrors.responsiblePhone ? '0 0 0 1px #EF4444' : undefined }}
                  numberInputProps={{
                    className: "w-full h-full border-none bg-transparent outline-none placeholder:text-gray-400",
                    style: { paddingLeft: '12px' }
                  }}
                />
              </div>
              {fieldErrors.responsiblePhone && <span style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px", display: "block" }}>{fieldErrors.responsiblePhone}</span>}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1, height: '48px', borderRadius: '12px', border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontWeight: 500 }} onClick={() => setRegisterStep(1)}>
                Voltar
              </button>
              <button type="button" className="btn btn-register" style={{ flex: 2 }} onClick={goToStep3}>
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Access Data ── */}
        {registerStep === 3 && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="register-field">
              <label>E-mail do Responsável (Login) <span style={{color: '#EF4444'}}>*</span></label>
              <div className="input-wrap" style={{ borderColor: fieldErrors.email ? '#EF4444' : undefined, boxShadow: fieldErrors.email ? '0 0 0 1px #EF4444' : undefined }}>
                <input
                  type="email"
                  autoComplete="off"
                  value={responsibleEmail}
                  onChange={(e) => { setResponsibleEmail(e.target.value); setFieldErrors(p => ({...p, email: ""})); }}
                  onBlur={() => checkAvailability('email')}
                  placeholder="email@exemplo.com"
                />
              </div>
              {fieldErrors.email && <span style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px", display: "block" }}>{fieldErrors.email}</span>}
            </div>

            <div className="register-field">
              <label>Senha <span style={{color: '#EF4444'}}>*</span></label>
              <div className="input-wrap" style={{ position: 'relative', borderColor: fieldErrors.registerPassword ? '#EF4444' : undefined, boxShadow: fieldErrors.registerPassword ? '0 0 0 1px #EF4444' : undefined }}>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={registerPassword}
                  onChange={(e) => { setRegisterPassword(e.target.value); setFieldErrors(p => ({...p, registerPassword: ""})); }}
                  placeholder="Crie uma senha forte"
                />
                <button type="button" className="toggle" onClick={() => setShowRegPassword(!showRegPassword)} aria-label="Mostrar senha" style={{position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0}}>
                  {showRegPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {fieldErrors.registerPassword && <span style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px", display: "block" }}>{fieldErrors.registerPassword}</span>}
            </div>

            <div className="register-field">
              <label>Confirmar senha <span style={{color: '#EF4444'}}>*</span></label>
              <div className="input-wrap" style={{ position: 'relative', borderColor: fieldErrors.registerPasswordConfirm ? '#EF4444' : undefined, boxShadow: fieldErrors.registerPasswordConfirm ? '0 0 0 1px #EF4444' : undefined }}>
                <input
                  type={showRegPasswordConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={registerPasswordConfirm}
                  onChange={(e) => { setRegisterPasswordConfirm(e.target.value); setFieldErrors(p => ({...p, registerPasswordConfirm: ""})); }}
                  placeholder="Repita a senha"
                />
                <button type="button" className="toggle" onClick={() => setShowRegPasswordConfirm(!showRegPasswordConfirm)} aria-label="Mostrar senha" style={{position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0}}>
                  {showRegPasswordConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {fieldErrors.registerPasswordConfirm && <span style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px", display: "block" }}>{fieldErrors.registerPasswordConfirm}</span>}
            </div>

            <Captcha onVerify={setCaptchaToken} />

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1, height: '48px', borderRadius: '12px', border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontWeight: 500 }} onClick={() => setRegisterStep(2)}>
                Voltar
              </button>
              <button type="button" className="btn btn-register" style={{ flex: 2 }} onClick={handleRegister}>
                Criar conta no Basileia
              </button>
            </div>
          </div>
        )}

        <div className="login-link" style={{ textAlign: 'center', marginTop: '8px' }}>
          Já possui uma conta? <a onClick={() => setIsRegistering(false)} style={{ cursor: 'pointer', color: '#7C3AED', fontWeight: 500 }}>Faça o login</a>
        </div>
      </div>
    </div>
  );
}
