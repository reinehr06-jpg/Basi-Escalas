"use client";

import React from "react";
import Link from "next/link";
import { Settings, Building2, SlidersHorizontal, UsersRound, Activity, ChevronRight } from "lucide-react";
import PageHeader from "@/components/escalas/PageHeader";
import { useAuth } from "@/context/AuthContext";

const CARDS = [
  {
    href: "/settings/organization",
    title: "Dados da igreja",
    description: "Nome, contato, fuso horário e idioma usados em todo o sistema.",
    icon: Building2,
    tint: "#EFF6FF",
    color: "#2563EB",
    adminOnly: true,
  },
  {
    href: "/settings/scheduling",
    title: "Regras e automações",
    description: "Prazo de confirmação, folga entre escalas, teto mensal e lembretes.",
    icon: SlidersHorizontal,
    tint: "#F4EEFF",
    color: "#7C3AED",
    adminOnly: true,
  },
  {
    href: "/systemUsers",
    title: "Usuários e papéis",
    description: "Quem acessa o sistema e o que cada papel pode fazer.",
    icon: UsersRound,
    tint: "#ECFDF5",
    color: "#047857",
    adminOnly: true,
  },
  {
    href: "/settings/logs",
    title: "Registro de atividades",
    description: "Histórico de publicações, trocas, exclusões e alterações.",
    icon: Activity,
    tint: "#FEF3C7",
    color: "#B45309",
    adminOnly: true,
  },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const role = (user as { role?: string } | null)?.role;
  const isAdmin = role === "admin" || role === "coordinator";

  const cards = CARDS.filter((card) => !card.adminOnly || isAdmin);

  return (
    <main className="p-6 pb-5 flex-1 flex flex-col">
      <div className="bg-white rounded-2xl flex-1 border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
        <PageHeader icon={Settings} title="Configurações" subtitle="Ajustes que valem para todo o sistema de escalas." />

        {cards.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#6B7280]">
            Nenhuma configuração disponível para o seu perfil.
          </p>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            {cards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="flex items-start gap-3 rounded-xl border border-[#E5E7EB] p-4 hover:border-[#D1D5DB] hover:bg-[#FAFAFC] transition-colors"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: card.tint }}>
                  <card.icon className="w-5 h-5" strokeWidth={2.2} style={{ color: card.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-[#1A1A2E]">{card.title}</p>
                  <p className="text-[12px] text-[#6B7280] mt-0.5">{card.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#9CA3AF] shrink-0 mt-1" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
