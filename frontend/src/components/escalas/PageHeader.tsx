"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

/** Cabeçalho padrão das telas: ícone em pastilha, título e subtítulo. */
export default function PageHeader({
  icon: Icon,
  title,
  subtitle,
  tint = "#F4EEFF",
  color = "#7C3AED",
  actions,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  tint?: string;
  color?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="p-6 pb-0 flex items-start gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: tint }}
      >
        <Icon className="w-5 h-5" strokeWidth={2.2} style={{ color }} />
      </div>
      <div className="flex flex-col justify-center min-w-0 flex-1">
        <h1 className="text-xl font-bold text-[#1A1A2E] leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-[#6B7280] mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
