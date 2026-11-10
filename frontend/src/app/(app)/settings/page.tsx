"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Settings, Building2, SlidersHorizontal, UsersRound, Activity, ChevronRight } from "lucide-react";
import PageHeader from "@/components/escalas/PageHeader";
import { useAuth } from "@/context/AuthContext";

const CARDS = [
  {
    href: "/settings/organization",
    title: "Church data",
    description: "Name, contact, time zone and language used across the system.",
    icon: Building2,
    tint: "#EFF6FF",
    color: "#2563EB",
    adminOnly: true,
  },
  {
    href: "/settings/scheduling",
    title: "Rules and automations",
    description: "Confirmation deadline, rest between schedules, monthly cap and reminders.",
    icon: SlidersHorizontal,
    tint: "#F4EEFF",
    color: "#7C3AED",
    adminOnly: true,
  },
  {
    href: "/systemUsers",
    title: "Users and roles",
    description: "Who accesses the system and what each role can do.",
    icon: UsersRound,
    tint: "#ECFDF5",
    color: "#047857",
    adminOnly: true,
  },
  {
    href: "/settings/logs",
    title: "Activity log",
    description: "History of publications, swaps, deletions and changes.",
    icon: Activity,
    tint: "#FEF3C7",
    color: "#B45309",
    adminOnly: true,
  },
];

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const role = (user as { role?: string } | null)?.role;
  const isAdmin = role === "admin" || role === "coordinator";

  const cards = CARDS.filter((card) => !card.adminOnly || isAdmin);

  return (
    <main className="p-6 pb-5 flex-1 flex flex-col">
      <div className="bg-white rounded-2xl flex-1 border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
        <PageHeader icon={Settings} title={t("Settings")} subtitle={t("Settings that apply to the whole scheduling system.")} />

        {cards.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#6B7280]">{t("No setting available for your profile.")}</p>
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
                  <p className="text-[13px] font-bold text-[#1A1A2E]">{t(card.title)}</p>
                  <p className="text-[12px] text-[#6B7280] mt-0.5">{t(card.description)}</p>
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
