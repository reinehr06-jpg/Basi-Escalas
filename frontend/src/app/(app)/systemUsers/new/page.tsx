"use client";

import React from "react";
import { UsersRound } from "lucide-react";
import PageHeader from "@/components/escalas/PageHeader";
import SystemUserForm from "@/components/forms/SystemUserForm";
import BackButton from "@/components/BackButton";

export default function NewSystemUserPage() {
  return (
    <main className="p-6 pb-5 flex-1 flex flex-col">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 pt-5">
          <BackButton href="/systemUsers" />
        </div>
        <PageHeader icon={UsersRound} title="Novo usuário" subtitle="Defina o papel e vincule ao cadastro de voluntário." />
        <SystemUserForm />
      </div>
    </main>
  );
}
