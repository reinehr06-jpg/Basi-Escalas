"use client";

import React from "react";
import { Users } from "lucide-react";
import PageHeader from "@/components/escalas/PageHeader";
import VolunteerForm from "@/components/forms/escalas/VolunteerForm";
import BackButton from "@/components/BackButton";

export default function NewVolunteerPage() {
  return (
    <main className="p-6 pb-5 flex-1 flex flex-col">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 pt-5">
          <BackButton href="/volunteers" />
        </div>
        <PageHeader icon={Users} title="Novo voluntário" subtitle="Dados, ministérios, funções e preferências de escala." />
        <VolunteerForm />
      </div>
    </main>
  );
}
