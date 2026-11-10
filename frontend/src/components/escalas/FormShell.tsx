"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, Loader2, Save } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Casca dos formulários, na mesma marcação do basileia-front:
 * banner roxo com voltar / título / ações, e o conteúdo em seções sanfonadas.
 */
export function FormHero({
  icon: Icon,
  title,
  subtitle,
  backHref,
  requiredNote,
  onSave,
  saving = false,
  disabled = false,
  saveLabel,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  backHref: string;
  requiredNote?: string;
  onSave: () => void;
  saving?: boolean;
  disabled?: boolean;
  saveLabel: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] rounded-2xl p-5 md:p-6 md:min-h-[116px] flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-[0_4px_16px_rgba(124,58,237,0.3)] mb-5 shrink-0">
      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) router.back();
            else router.push(backHref);
          }}
          className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-white hover:bg-gray-50 border border-[#E5E7EB] text-[#475569] flex items-center justify-center shrink-0 shadow-sm transition-all cursor-pointer active:scale-95"
          title={t("Back")}
          aria-label={t("Back")}
        >
          <ChevronLeft className="w-5 h-5 text-[#475569]" strokeWidth={2.4} />
        </button>

        <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner shadow-white/30 text-white">
          <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
        </div>

        <div className="flex flex-col justify-center min-w-0">
          <h1 className="text-xl md:text-2xl font-extrabold text-white leading-tight drop-shadow-sm tracking-tight truncate">
            {title}
          </h1>
          <p className="text-xs md:text-[13px] text-purple-100/90 mt-0.5 font-medium leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
        {requiredNote && (
          <span className="text-xs text-purple-100/90 font-medium whitespace-nowrap">
            <span className="text-pink-300 font-bold">*</span> {requiredNote}
          </span>
        )}

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href={backHref}
            className="h-[38px] px-3.5 sm:px-4 bg-white/15 hover:bg-white/25 border border-white/20 text-white font-semibold text-xs sm:text-sm rounded-[10px] transition-all flex items-center justify-center cursor-pointer active:scale-[0.98]"
          >
            {t("Cancel")}
          </Link>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || disabled}
            className="h-[38px] px-3.5 sm:px-4 bg-white text-[#7C3AED] hover:bg-gray-50 font-semibold text-xs sm:text-sm rounded-[10px] transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#7C3AED]" strokeWidth={2.2} />
            ) : (
              <Save className="w-4 h-4 text-[#7C3AED]" strokeWidth={2.2} />
            )}
            <span>{saving ? t("Saving...") : saveLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/** Cartão branco que envolve as seções do formulário. */
export function FormCard({ children, loading = false }: { children: React.ReactNode; loading?: boolean }) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_16px_rgba(0,0,0,0.02)] p-4 flex flex-col gap-3">
      {loading ? <div className="p-8 text-center text-sm text-gray-500">{t("Loading...")}</div> : children}
    </div>
  );
}

/** Seção sanfonada: a mesma usada nos formulários do basileia-front. */
export function FormSection({
  icon: Icon,
  title,
  description,
  required = false,
  open,
  onToggle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  required?: boolean;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`border rounded-[10px] bg-white transition-all duration-300 ${
        open
          ? "border-[#D1D5DB] shadow-sm overflow-visible"
          : "border-[#E5E7EB] hover:border-[#D1D5DB] hover:shadow-sm overflow-hidden"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between p-[14px_16px] min-h-[72px] focus:outline-none group cursor-pointer"
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              open
                ? "bg-gradient-to-br from-[#6D28D9] to-[#7C3AED] shadow-md shadow-[#7C3AED]/20 text-white"
                : "bg-[#F4EEFF] group-hover:bg-[#EAE0FF] text-[#7C3AED]"
            }`}
          >
            <Icon className="w-[18px] h-[18px]" strokeWidth={2.2} />
          </div>
          <div className="flex flex-col items-start text-left">
            <h2 className="text-[15px] font-[700] text-[#1A1A2E]">
              {title} {required && <span className="text-[#EF4444] ml-0.5">*</span>}
            </h2>
            <p className="text-[13px] text-[#6B7280] mt-0.5">{description}</p>
          </div>
        </div>
        <div className="shrink-0 ml-4">
          <ChevronDown
            className={`w-[18px] h-[18px] text-[#9CA3AF] transition-transform duration-300 ${
              open ? "rotate-180 text-[#111827]" : "group-hover:text-[#6B7280]"
            }`}
            strokeWidth={2.4}
          />
        </div>
      </button>

      <div
        className={`transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="border-t border-[#F1F1F4] px-5 pb-5 pt-4 bg-[#FCFCFD]">{children}</div>
      </div>
    </div>
  );
}
