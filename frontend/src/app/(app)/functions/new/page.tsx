"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ClipboardList } from "lucide-react";
import PageHeader from "@/components/escalas/PageHeader";
import FunctionForm from "@/components/forms/escalas/FunctionForm";
import BackButton from "@/components/BackButton";

function NewFunctionContent() {
  const params = useSearchParams();

  return <FunctionForm defaultMinistryId={params.get("ministry_id") ?? undefined} />;
}

export default function NewFunctionPage() {
  return (
    <main className="p-6 pb-5 flex-1 flex flex-col">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 pt-5">
          <BackButton href="/functions" />
        </div>
        <PageHeader icon={ClipboardList} title="Nova função" subtitle="Defina o papel e quantas pessoas ele ocupa por escala." />
        <Suspense fallback={<div className="p-10 text-center text-sm text-[#6B7280]">Carregando…</div>}>
          <NewFunctionContent />
        </Suspense>
      </div>
    </main>
  );
}
