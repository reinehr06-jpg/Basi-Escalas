"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/escalas/PageHeader";
import FunctionForm from "@/components/forms/escalas/FunctionForm";
import BackButton from "@/components/BackButton";
import { FunctionsService } from "@/services/functions.service";
import type { MinistryFunction } from "@/types/escalas";

export default function EditFunctionPage() {
  const { id } = useParams<{ id: string }>();
  const [fn, setFn] = useState<MinistryFunction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    FunctionsService.getById(id)
      .then((res) => setFn(res.item))
      .catch((err) => toast.error(err.message || "Função não encontrada."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <main className="p-6 pb-5 flex-1 flex flex-col">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 pt-5">
          <BackButton href="/functions" />
        </div>
        <PageHeader icon={ClipboardList} title={fn ? `Editar ${fn.name}` : "Editar função"} subtitle="Altere o papel, a quantidade e as habilidades exigidas." />
        {loading ? (
          <div className="p-10 text-center text-sm text-[#6B7280]">Carregando…</div>
        ) : fn ? (
          <FunctionForm fn={fn} />
        ) : (
          <div className="p-10 text-center text-sm text-[#6B7280]">Função não encontrada.</div>
        )}
      </div>
    </main>
  );
}
