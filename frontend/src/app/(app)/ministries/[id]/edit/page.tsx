"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Layers } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/escalas/PageHeader";
import MinistryForm from "@/components/forms/escalas/MinistryForm";
import BackButton from "@/components/BackButton";
import { MinistriesService } from "@/services/ministries.service";
import type { Ministry } from "@/types/escalas";

export default function EditMinistryPage() {
  const { id } = useParams<{ id: string }>();
  const [ministry, setMinistry] = useState<Ministry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    MinistriesService.getById(id)
      .then((res) => setMinistry(res.item))
      .catch((err) => toast.error(err.message || "Ministério não encontrado."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <main className="p-6 pb-5 flex-1 flex flex-col">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 pt-5">
          <BackButton href="/ministries" />
        </div>
        <PageHeader icon={Layers} title={ministry ? `Editar ${ministry.name}` : "Editar ministério"} subtitle="Altere dados, líderes e regras de escala." />
        {loading ? (
          <div className="p-10 text-center text-sm text-[#6B7280]">Carregando…</div>
        ) : ministry ? (
          <MinistryForm ministry={ministry} />
        ) : (
          <div className="p-10 text-center text-sm text-[#6B7280]">Ministério não encontrado.</div>
        )}
      </div>
    </main>
  );
}
