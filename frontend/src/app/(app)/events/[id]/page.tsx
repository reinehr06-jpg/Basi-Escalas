"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CalendarDays, Pencil, Plus, MapPin, Ban, ClipboardList } from "lucide-react";
import DetailHero from "@/components/escalas/DetailHero";
import StatusBadge from "@/components/escalas/StatusBadge";
import EmptyState from "@/components/escalas/EmptyState";
import Modal from "@/components/Modal";
import CustomSelect from "@/components/CustomSelect";
import { EventsService } from "@/services/events.service";
import { MinistriesService } from "@/services/ministries.service";
import { SchedulesService } from "@/services/schedules.service";
import type { CalendarEvent, Ministry, Schedule } from "@/types/escalas";
import { EVENT_TYPE_LABELS, formatEventStamp, formatTime } from "@/lib/escalas-format";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [eventMinistries, setEventMinistries] = useState<Ministry[]>([]);
  const [allMinistries, setAllMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);

  const [creatingFor, setCreatingFor] = useState("");
  const [creating, setCreating] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelScope, setCancelScope] = useState<"single" | "series">("single");
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await EventsService.getById(id);
      setEvent(res.item);
      setSchedules(res.schedules ?? []);
      setEventMinistries(res.ministries ?? []);
    } catch (err) {
      toast.error((err as Error).message || "Evento não encontrado.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    MinistriesService.list({ itemsPerPage: 200, status: "active" })
      .then((res) => setAllMinistries(res.data ?? []))
      .catch(() => setAllMinistries([]));
  }, [load]);

  const createSchedule = async () => {
    if (!creatingFor) return;
    setCreating(true);
    try {
      const res = await SchedulesService.create({ event_id: id, ministry_id: creatingFor });
      toast.success(res.message ?? "Escala criada.");
      router.push(`/schedules/${res.item.id}`);
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível criar a escala.");
    } finally {
      setCreating(false);
    }
  };

  const cancelEvent = async () => {
    if (!cancelReason.trim()) return;
    setCancelling(true);
    try {
      const res = await EventsService.cancel(id, cancelReason.trim(), cancelScope);
      toast.success(res.message);
      setShowCancel(false);
      setCancelReason("");
      load();
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível cancelar o evento.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <main className="p-6 flex-1"><div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center text-sm text-[#6B7280]">Carregando…</div></main>;
  }

  if (!event) {
    return <main className="p-6 flex-1"><div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center text-sm text-[#6B7280]">Evento não encontrado.</div></main>;
  }

  const scheduledMinistryIds = schedules.map((s) => s.ministry_id);
  const available = (eventMinistries.length > 0 ? eventMinistries : allMinistries)
    .filter((m) => !scheduledMinistryIds.includes(m.id));
  const ministryById = Object.fromEntries(allMinistries.map((m) => [m.id, m]));
  const isCancelled = event.status === "cancelled";

  return (
    <>
      <main className="p-4 md:py-5 px-4 md:px-8 flex-1 flex flex-col max-w-screen-2xl mx-auto w-full gap-4">
        <DetailHero
          icon={CalendarDays}
          breadcrumb={{ label: t("Calendar"), href: "/events" }}
          title={event.title}
          subtitle={event.description ?? undefined}
          backHref="/events"
          backTitle={t("Back to Calendar")}
          actions={
            <>
              {!isCancelled && (
                <button
                  onClick={() => setShowCancel(true)}
                  className="h-[38px] px-3.5 sm:px-4 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold text-xs sm:text-sm rounded-[10px] transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <Ban className="w-4 h-4 text-white" strokeWidth={2.2} />
                  <span>{t("Cancel event")}</span>
                </button>
              )}
              <Link
                href={`/events/${event.id}/edit`}
                className="h-[38px] px-3.5 sm:px-4 bg-white hover:bg-purple-50 text-[#6D28D9] font-bold text-xs sm:text-sm rounded-[10px] transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <Pencil className="w-3.5 h-3.5 text-[#6D28D9]" strokeWidth={2.4} />
                <span>{t("Edit event")}</span>
              </Link>
            </>
          }
        />

        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="px-6 py-5 flex flex-wrap gap-x-8 gap-y-3 items-center text-[12px] text-[#4B5563]">
            <StatusBadge status={event.status} />
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-[#9CA3AF]" />
              {formatEventStamp(event.starts_at)}
              {event.ends_at ? ` – ${formatTime(event.ends_at)}` : ""}
            </span>
            {event.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#9CA3AF]" />
                {event.location}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-[#9CA3AF]" />
              {EVENT_TYPE_LABELS[event.type] ?? event.type}
            </span>
          </div>

          {isCancelled && event.cancellation_reason && (
            <div className="mx-6 mb-6 rounded-lg bg-[#EF4444]/5 border border-[#EF4444]/20 px-4 py-3">
              <p className="text-[12px] font-semibold text-[#B91C1C]">Evento cancelado</p>
              <p className="text-[12px] text-[#7F1D1D] mt-0.5">{event.cancellation_reason}</p>
            </div>
          )}
        </div>

        <section className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <header className="px-5 h-12 flex items-center justify-between border-b border-[#F1F1F4] gap-3">
            <h2 className="text-[13px] font-bold text-[#1A1A2E]">Escalas deste evento</h2>

            {!isCancelled && available.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-[190px]">
                  <CustomSelect
                    value={creatingFor}
                    onChange={(value: string) => setCreatingFor(value)}
                    placeholder="Escolher ministério"
                    searchable
                    className="h-9"
                    options={available.map((m) => ({ value: m.id, label: m.name }))}
                  />
                </div>
                <button
                  onClick={createSchedule}
                  disabled={!creatingFor || creating}
                  className="inline-flex items-center gap-1.5 px-3 h-9 bg-[#6D28D9] text-white text-[13px] font-semibold rounded-lg hover:bg-[#5B21B6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.4} />
                  {creating ? "Criando…" : "Criar escala"}
                </button>
              </div>
            )}
          </header>

          {schedules.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Nenhuma escala criada"
              description="Escolha um ministério acima para montar a primeira escala deste evento."
            />
          ) : (
            <ul className="divide-y divide-[#F1F1F4]">
              {schedules.map((schedule) => {
                const ministry = ministryById[schedule.ministry_id];
                return (
                  <li key={schedule.id}>
                    <Link href={`/schedules/${schedule.id}`} className="px-5 py-3 flex items-center gap-3 hover:bg-[#FAFAFC] transition-colors">
                      <span className="w-1.5 h-9 rounded-full shrink-0" style={{ backgroundColor: ministry?.color ?? "#6D28D9" }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-semibold text-[#1A1A2E] truncate">
                            {ministry?.name ?? schedule.name}
                          </p>
                          <StatusBadge status={schedule.status} />
                        </div>
                        <p className="text-[11px] text-[#6B7280] mt-0.5">
                          {schedule.slots?.length ?? 0} função(ões) na escala
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      <Modal open={showCancel} onClose={() => setShowCancel(false)}>
        <div className="flex flex-col gap-4 p-6">
          <h2 className="text-[16px] font-bold text-[#1A1A2E]">Cancelar evento</h2>
          <p className="text-[13px] text-[#4B5563]">
            O evento fica registrado como cancelado e todas as escalações vinculadas são canceladas junto.
            O histórico é preservado.
          </p>

          <div className="flex flex-col gap-[6px]">
            <label htmlFor="cancel-reason" className="text-[13px] font-[600] text-[#4B5563]">
              Motivo <span className="text-[#EF4444] ml-0.5">*</span>
            </label>
            <textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder="Explique o que aconteceu — os voluntários verão esta mensagem."
              className="px-3 py-2.5 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9] resize-y"
            />
          </div>

          {event.series_id && (
            <div className="flex flex-col gap-[6px]">
              <label className="text-[13px] font-[600] text-[#4B5563]">Alcance</label>
              <CustomSelect
                value={cancelScope}
                onChange={(value: string) => setCancelScope(value as "single" | "series")}
                className="h-[42px]"
                options={[
                  { value: "single", label: "Somente este evento" },
                  { value: "series", label: "Este e os próximos da série" },
                ]}
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setShowCancel(false)}
              className="px-4 h-9 rounded-lg border border-[#E5E7EB] bg-white text-[13px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB] transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={cancelEvent}
              disabled={!cancelReason.trim() || cancelling}
              className="px-4 h-9 rounded-lg bg-[#EF4444] text-white text-[13px] font-semibold hover:bg-[#DC2626] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {cancelling ? "Cancelando…" : "Confirmar cancelamento"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
