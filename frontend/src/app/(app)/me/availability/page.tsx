"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CalendarDays } from "lucide-react";
import PageHeader from "@/components/escalas/PageHeader";
import AvailabilityEditor from "@/components/escalas/AvailabilityEditor";
import BackButton from "@/components/BackButton";
import { MeService } from "@/services/escalas-dashboard.service";
import type { Availability } from "@/types/escalas";

export default function MyAvailabilityPage() {
  const { t } = useTranslation();
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
      toast.error((err as Error).message || t("Could not load your availability."));
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
          title={t("My availability")}
          subtitle={t("Leadership uses this to avoid scheduling you on days you cannot serve.")}
        />

        {loading ? (
          <div className="p-10 text-center text-sm text-[#6B7280]">{t("Loading...")}</div>
        ) : volunteerId ? (
          <AvailabilityEditor volunteerId={volunteerId} initial={availabilities} onSaved={load} />
        ) : (
          <div className="p-10 text-center text-sm text-[#6B7280]">{t("Your user is not linked to a volunteer record yet.")}</div>
        )}
      </div>
    </main>
  );
}
