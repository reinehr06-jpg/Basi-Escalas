"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarDays } from "lucide-react";
import PageHeader from "@/components/escalas/PageHeader";
import AvailabilityEditor from "@/components/escalas/AvailabilityEditor";
import BackButton from "@/components/BackButton";
import { MeService } from "@/services/escalas-dashboard.service";
import type { Availability } from "@/types/escalas";

export default function MyAvailabilityPage() {
  const [volunteerId, setVolunteerId] = useState<string | null>(null);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await MeService.dashboard();
      setVolunteerId(res.volunteer?.id ?? null);
      setAvailabilities(res.availabilities ?? []);
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível carregar sua disponibilidade.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="p-6 pb-5 flex-1 flex flex-col">
      <div className="bg-white rounded-2xl flex-1 border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 pt-5">
          <BackButton href="/me" />
        </div>

        <PageHeader
          icon={CalendarDays}
          title="Minha disponibilidade"
          subtitle="A liderança usa isso para não te escalar em dias que você não pode."
        />

        {loading ? (
          <div className="p-10 text-center text-sm text-[#6B7280]">Carregando…</div>
        ) : volunteerId ? (
          <AvailabilityEditor volunteerId={volunteerId} initial={availabilities} onSaved={load} />
        ) : (
          <div className="p-10 text-center text-sm text-[#6B7280]">
            Seu usuário ainda não está vinculado a um cadastro de voluntário.
          </div>
        )}
      </div>
    </main>
  );
}
