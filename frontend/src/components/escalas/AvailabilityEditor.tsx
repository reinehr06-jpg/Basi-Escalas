"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { AvailabilityService } from "@/services/availability.service";
import type { Availability } from "@/types/escalas";
import { WEEKDAYS } from "@/types/escalas";

/**
 * Grade semanal de disponibilidade.
 *
 * Só gravamos as indisponibilidades: ausência de registro significa
 * disponível, o que evita exigir que todo voluntário preencha a semana inteira.
 */
export default function AvailabilityEditor({
  volunteerId,
  initial,
  onSaved,
}: {
  volunteerId: string;
  initial?: Availability[];
  onSaved?: () => void;
}) {
  const { t } = useTranslation();
  const [blocked, setBlocked] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setBlocked(
      (initial ?? []).filter((a) => !a.is_available).map((a) => a.weekday),
    );
    setDirty(false);
  }, [initial]);

  const toggle = (weekday: number) => {
    setBlocked((prev) =>
      prev.includes(weekday) ? prev.filter((d) => d !== weekday) : [...prev, weekday],
    );
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await AvailabilityService.sync(
        volunteerId,
        blocked.map((weekday) => ({ weekday, is_available: false })),
      );
      toast.success(res.message);
      setDirty(false);
      onSaved?.();
    } catch (err) {
      toast.error((err as Error).message || t("Could not save the availability."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5">
      <p className="text-[12px] text-[#6B7280] mb-3">
        {t("Mark the days the volunteer cannot serve. Unmarked days stay available.")}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {WEEKDAYS.map((label, index) => {
          const isBlocked = blocked.includes(index);
          return (
            <button
              key={label}
              type="button"
              onClick={() => toggle(index)}
              aria-pressed={isBlocked}
              className={`h-9 px-3 rounded-lg border text-[12px] font-semibold transition-colors ${
                isBlocked
                  ? "bg-[#EF4444]/10 text-[#B91C1C] border-[#EF4444]/30"
                  : "bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-[#F9FAFB]"
              }`}
            >
              {label.slice(0, 3)}
            </button>
          );
        })}
      </div>

      {dirty && (
        <button
          onClick={save}
          disabled={saving}
          className="mt-4 inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg bg-[#6D28D9] text-white text-[13px] font-semibold hover:bg-[#5B21B6] disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" strokeWidth={2.2} />
          {saving ? t("Saving...") : "Salvar disponibilidade"}
        </button>
      )}
    </div>
  );
}
