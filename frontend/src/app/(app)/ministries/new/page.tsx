"use client";

import React from "react";
import { Layers } from "lucide-react";
import PageHeader from "@/components/escalas/PageHeader";
import MinistryForm from "@/components/forms/escalas/MinistryForm";
import BackButton from "@/components/BackButton";

export default function NewMinistryPage() {
  return (
    <main className="p-6 pb-5 flex-1 flex flex-col">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 pt-5">
          <BackButton href="/ministries" />
        </div>
        <PageHeader icon={Layers} title="Novo ministério" subtitle="Defina a equipe, os líderes e as regras de escala." />
        <MinistryForm />
      </div>
    </main>
  );
}
