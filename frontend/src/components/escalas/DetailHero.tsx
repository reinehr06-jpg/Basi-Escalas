"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import BackButton from "@/components/BackButton";

/**
 * Banner das telas de detalhe, na mesma marcação do basileia-front:
 * voltar, ícone translúcido, trilha de navegação, título e ações à direita.
 */
export default function DetailHero({
  icon: Icon,
  breadcrumb,
  title,
  subtitle,
  backHref,
  backTitle,
  actions,
}: {
  icon: LucideIcon;
  breadcrumb: { label: string; href: string };
  title: string;
  subtitle?: React.ReactNode;
  backHref: string;
  backTitle: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] rounded-[16px] md:rounded-[20px] p-[16px_20px] md:p-[20px_24px] flex flex-col md:flex-row md:items-center justify-between gap-[16px] shadow-[0_4px_16px_rgba(124,58,237,0.3)] my-4 mb-5 shrink-0">
      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
        <BackButton
          href={backHref}
          title={backTitle}
          className="w-[42px] h-[42px] md:w-[44px] md:h-[44px] rounded-[14px] bg-white border border-white text-[#6D28D9] flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:bg-[#F4EEFF] hover:scale-[1.02] transition-all duration-200 active:scale-[0.97] cursor-pointer"
        />

        <div className="w-[42px] h-[42px] md:w-[44px] md:h-[44px] rounded-[14px] bg-white/15 border border-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner shadow-white/30 text-white">
          <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
        </div>

        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-[6px] text-xs font-[500] text-purple-200/90 mb-0.5">
            <Link href={breadcrumb.href} className="hover:text-white transition-colors">
              {breadcrumb.label}
            </Link>
            <span>/</span>
            <span className="text-white font-semibold truncate max-w-[200px] sm:max-w-none">{title}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-[800] text-white leading-tight drop-shadow-sm tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-[13px] text-purple-100/90 mt-0.5 font-medium truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap sm:flex-nowrap">{actions}</div>
      )}
    </div>
  );
}
