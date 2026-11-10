"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
import { EventsService } from "@/services/events.service";
import { MinistriesService } from "@/services/ministries.service";
import type { CalendarEvent, Ministry } from "@/types/escalas";
import { EVENT_TYPE_LABELS, toInputDateTime } from "@/lib/escalas-format";
import { WEEKDAYS } from "@/types/escalas";

interface Props {
  event?: CalendarEvent;
}

export default function EventForm({ event }: Props) {
  const router = useRouter();
  const editing = Boolean(event);

  const [title, setTitle] = useState(event?.title ?? "");
  const [type, setType] = useState(event?.type ?? "service");
  const [startsAt, setStartsAt] = useState(toInputDateTime(event?.starts_at));
  const [endsAt, setEndsAt] = useState(toInputDateTime(event?.ends_at));
  const [location, setLocation] = useState(event?.location ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [ministryIds, setMinistryIds] = useState<string[]>(event?.ministry_ids ?? []);

  const [frequency, setFrequency] = useState<"none" | "weekly" | "monthly">("none");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [until, setUntil] = useState("");

  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    MinistriesService.list({ itemsPerPage: 200, status: "active" })
      .then((res) => setMinistries(res.data ?? []))
      .catch(() => setMinistries([]));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);

    const payload: Record<string, unknown> = {
      title: title.trim(),
      type,
      starts_at: startsAt,
      ends_at: endsAt || null,
      location: location.trim() || null,
      description: description.trim() || null,
      ministry_ids: ministryIds,
    };

    // Recorrência só vale na criação: editar uma série usa `scope`.
    if (!editing && frequency !== "none") {
      payload.recurrence = {
        frequency,
        interval: 1,
        weekdays: frequency === "weekly" ? weekdays : [],
        until: until || null,
      };
    }

    try {
      const res = editing && event
        ? await EventsService.update(event.id, payload)
        : await EventsService.create(payload as never);
      toast.success(res.message);
      router.push(`/events/${res.item.id}`);
      router.refresh();
    } catch (err) {
      const apiError = err as Error & { errors?: Record<string, string[]> };
      setErrors(apiError.errors ?? {});
      toast.error(apiError.message || "Não foi possível salvar o evento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-[6px] md:col-span-2">
          <label htmlFor="event-title" className="text-[13px] font-[600] text-[#4B5563]">
            Título <span className="text-[#EF4444] ml-0.5">*</span>
          </label>
          <input
            id="event-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Culto de Celebração"
            className={`h-[42px] px-3 rounded-lg border text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9] ${
              errors.title ? "border-[#EF4444]" : "border-[#E5E7EB]"
            }`}
            required
          />
          {errors.title && <span className="text-[11px] text-[#EF4444]">{errors.title[0]}</span>}
        </div>

        <div className="flex flex-col gap-[6px]">
          <label className="text-[13px] font-[600] text-[#4B5563]">Tipo</label>
          <CustomSelect
            value={type}
            onChange={(value: string) => setType(value as typeof type)}
            placeholder="Selecione"
            className="h-[42px]"
            options={Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </div>

        <div className="flex flex-col gap-[6px]">
          <label htmlFor="event-location" className="text-[13px] font-[600] text-[#4B5563]">Local</label>
          <input
            id="event-location"
            value={location ?? ""}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Templo Sede"
            className="h-[42px] px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
          />
        </div>

        <div className="flex flex-col gap-[6px]">
          <label htmlFor="event-start" className="text-[13px] font-[600] text-[#4B5563]">
            Início <span className="text-[#EF4444] ml-0.5">*</span>
          </label>
          <input
            id="event-start"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className={`h-[42px] px-3 rounded-lg border text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9] ${
              errors.starts_at ? "border-[#EF4444]" : "border-[#E5E7EB]"
            }`}
            required
          />
          {errors.starts_at && <span className="text-[11px] text-[#EF4444]">{errors.starts_at[0]}</span>}
        </div>

        <div className="flex flex-col gap-[6px]">
          <label htmlFor="event-end" className="text-[13px] font-[600] text-[#4B5563]">Término</label>
          <input
            id="event-end"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="h-[42px] px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
          />
        </div>

        <div className="flex flex-col gap-[6px] md:col-span-2">
          <label className="text-[13px] font-[600] text-[#4B5563]">Ministérios envolvidos</label>
          <CustomSelect
            value={ministryIds}
            onChange={(value: string[]) => setMinistryIds(value)}
            placeholder="Selecione os ministérios"
            multiple
            searchable
            className="h-[42px]"
            options={ministries.map((m) => ({ value: m.id, label: m.name }))}
          />
          <span className="text-[11px] text-[#9CA3AF]">Define quais escalas serão sugeridas para este evento.</span>
        </div>

        <div className="flex flex-col gap-[6px] md:col-span-2">
          <label htmlFor="event-description" className="text-[13px] font-[600] text-[#4B5563]">Observações</label>
          <textarea
            id="event-description"
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="px-3 py-2.5 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9] resize-y"
          />
        </div>
      </div>

      {!editing && (
        <section className="rounded-xl border border-[#E5E7EB] p-4">
          <h2 className="text-[13px] font-bold text-[#1A1A2E]">Repetição</h2>
          <p className="text-[11px] text-[#6B7280] mt-0.5 mb-3">
            Cada ocorrência vira um evento próprio, com escala e confirmações independentes.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-[6px]">
              <label className="text-[13px] font-[600] text-[#4B5563]">Frequência</label>
              <CustomSelect
                value={frequency}
                onChange={(value: string) => setFrequency(value as typeof frequency)}
                placeholder="Não repete"
                className="h-[42px]"
                options={[
                  { value: "none", label: "Não repete" },
                  { value: "weekly", label: "Semanal" },
                  { value: "monthly", label: "Mensal" },
                ]}
              />
            </div>

            {frequency !== "none" && (
              <div className="flex flex-col gap-[6px]">
                <label htmlFor="event-until" className="text-[13px] font-[600] text-[#4B5563]">Repetir até</label>
                <input
                  id="event-until"
                  type="date"
                  value={until}
                  onChange={(e) => setUntil(e.target.value)}
                  className="h-[42px] px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
                />
                <span className="text-[11px] text-[#9CA3AF]">Em branco: um ano a partir do início.</span>
              </div>
            )}

            {frequency === "weekly" && (
              <div className="flex flex-col gap-[6px] sm:col-span-2">
                <span className="text-[13px] font-[600] text-[#4B5563]">Dias da semana</span>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAYS.map((label, index) => {
                    const active = weekdays.includes(index);
                    return (
                      <button
                        key={label}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          setWeekdays(active ? weekdays.filter((d) => d !== index) : [...weekdays, index])
                        }
                        className={`h-9 px-3 rounded-lg border text-[12px] font-semibold transition-colors ${
                          active
                            ? "bg-[#6D28D9] text-white border-[#6D28D9]"
                            : "bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-[#F9FAFB]"
                        }`}
                      >
                        {label.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[11px] text-[#9CA3AF]">Sem seleção, repete no mesmo dia da semana do início.</span>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F1F1F4]">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 h-9 rounded-lg border border-[#E5E7EB] bg-white text-[13px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB] transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim() || !startsAt}
          className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[#6D28D9] text-white text-[13px] font-semibold hover:bg-[#5B21B6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <Save className="w-4 h-4" strokeWidth={2.4} />
          {saving ? "Salvando…" : editing ? "Salvar alterações" : "Criar evento"}
        </button>
      </div>
    </form>
  );
}
