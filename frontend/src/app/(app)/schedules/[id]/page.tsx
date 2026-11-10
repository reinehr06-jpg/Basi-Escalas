"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ClipboardList, Plus, Send, Wand2, Copy, Trash2, Lock, UserMinus,
  CalendarDays, MapPin, Crown,
} from "lucide-react";
import DetailHero from "@/components/escalas/DetailHero";
import StatusBadge from "@/components/escalas/StatusBadge";
import CoverageBar from "@/components/escalas/CoverageBar";
import VolunteerAvatar from "@/components/escalas/VolunteerAvatar";
import CandidatePicker from "@/components/escalas/CandidatePicker";
import DeleteModal from "@/components/modals/DeleteModal";
import { SchedulesService } from "@/services/schedules.service";
import { AssignmentsService } from "@/services/assignments.service";
import type { ScheduleDetail } from "@/types/escalas";
import { formatEventStamp } from "@/lib/escalas-format";

export default function ScheduleBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const [detail, setDetail] = useState<ScheduleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [pickerFor, setPickerFor] = useState<{ functionId: string; functionName: string } | null>(null);
  const [removing, setRemoving] = useState<{ id: string; name: string } | null>(null);
  const [confirmDeleteSchedule, setConfirmDeleteSchedule] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setDetail(await SchedulesService.getById(id));
    } catch (err) {
      toast.error((err as Error).message || "Escala não encontrada.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const assign = async (volunteerId: string) => {
    if (!pickerFor) return;
    setBusy(true);
    try {
      const res = await AssignmentsService.create({
        schedule_id: id,
        function_id: pickerFor.functionId,
        volunteer_id: volunteerId,
      });
      toast.success(res.message);
      setPickerFor(null);
      load();
    } catch (err) {
      toast.error((err as Error).message || t("Could not assign."));
    } finally {
      setBusy(false);
    }
  };

  const removeAssignment = async () => {
    if (!removing) return;
    setBusy(true);
    try {
      const res = await AssignmentsService.remove(removing.id);
      toast.success(res.message);
      setRemoving(null);
      load();
    } catch (err) {
      toast.error((err as Error).message || t("Could not remove."));
    } finally {
      setBusy(false);
    }
  };

  const autofill = async () => {
    setBusy(true);
    try {
      const res = await SchedulesService.autofill(id, true);
      toast.success(res.message ?? "Escala preenchida.");
      load();
    } catch (err) {
      toast.error((err as Error).message || t("Could not autofill."));
    } finally {
      setBusy(false);
    }
  };

  const publish = async (force = false) => {
    setBusy(true);
    try {
      const res = await SchedulesService.publish(id, force);
      toast.success(res.message ?? "Escala publicada.");
      load();
    } catch (err) {
      const apiError = err as Error & { data?: { requires_force?: boolean } };
      if (apiError.data?.requires_force) {
        // Faltam vagas: só publica se o líder assumir isso explicitamente.
        toast.warning(apiError.message, {
          action: { label: t("Publish anyway"), onClick: () => publish(true) },
        });
      } else {
        toast.error(apiError.message || t("Could not publish."));
      }
    } finally {
      setBusy(false);
    }
  };

  const close = async () => {
    setBusy(true);
    try {
      const res = await SchedulesService.close(id);
      toast.success(res.message);
      load();
    } catch (err) {
      toast.error((err as Error).message || t("Could not close."));
    } finally {
      setBusy(false);
    }
  };

  const destroy = async () => {
    setBusy(true);
    try {
      const res = await SchedulesService.remove(id);
      toast.success(res.message);
      router.push("/schedules");
    } catch (err) {
      toast.error((err as Error).message || t("Could not delete."));
      setConfirmDeleteSchedule(false);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <main className="p-6 flex-1"><div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center text-sm text-[#6B7280]">{t("Loading...")}</div></main>;
  }

  if (!detail) {
    return <main className="p-6 flex-1"><div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center text-sm text-[#6B7280]">{t("Schedule not found.")}</div></main>;
  }

  const { item: schedule, event, ministry, slots, summary } = detail;
  const editable = schedule.status === "draft" || schedule.status === "published";
  const color = ministry?.color ?? "#6D28D9";

  return (
    <>
      <main className="p-4 md:py-5 px-4 md:px-8 flex-1 flex flex-col max-w-screen-2xl mx-auto w-full gap-4">
        <DetailHero
          icon={ClipboardList}
          breadcrumb={{ label: t("Rosters"), href: "/schedules" }}
          title={ministry?.name ?? schedule.name}
          subtitle={event?.title}
          backHref="/schedules"
          backTitle={t("Back to Schedules")}
          actions={
            <>
              <span className="h-[38px] px-3.5 bg-white/15 border border-white/20 text-white font-semibold text-xs sm:text-sm rounded-[10px] flex items-center">
                {t(schedule.status === "draft" ? "Draft" : schedule.status === "published" ? "Published" : "Closed")}
              </span>
              <Link
                href={`/events/${schedule.event_id}`}
                className="h-[38px] px-3.5 sm:px-4 bg-white hover:bg-purple-50 text-[#6D28D9] font-bold text-xs sm:text-sm rounded-[10px] transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <CalendarDays className="w-3.5 h-3.5 text-[#6D28D9]" strokeWidth={2.4} />
                <span>{t("Open event")}</span>
              </Link>
            </>
          }
        />

        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="px-6 pt-5 flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-[#4B5563]">
            {event && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-[#9CA3AF]" />
                <Link href={`/events/${event.id}`} className="hover:underline">
                  {formatEventStamp(event.starts_at)}
                </Link>
              </span>
            )}
            {event?.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#9CA3AF]" />
                {event.location}
              </span>
            )}
          </div>

          <div className="px-6 py-4">
            <div className="rounded-xl border border-[#E5E7EB] p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wide">Cobertura</span>
                <span className="text-[13px] font-bold text-[#1A1A2E] tabular-nums">{summary.completion}%</span>
              </div>
              <CoverageBar filled={summary.filled} needed={summary.needed} height={8} />
              {summary.missing > 0 && (
                <p className="text-[11px] text-[#B45309] mt-2">
                  {summary.missing} vaga(s) ainda em aberto.
                </p>
              )}
            </div>
          </div>

          <div className="px-6 pb-6 flex flex-wrap items-center gap-2">
            {editable && (
              <>
                <button
                  onClick={autofill}
                  disabled={busy || summary.missing === 0}
                  className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg border border-[#E5E7EB] bg-white text-[13px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={summary.missing === 0 ? t("The schedule is already complete") : "Preencher vagas em aberto"}
                >
                  <Wand2 className="w-4 h-4" strokeWidth={2.2} />{t("Autofill")}</button>

                {schedule.status === "draft" && (
                  <button
                    onClick={() => publish(false)}
                    disabled={busy || summary.filled === 0}
                    className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg bg-[#6D28D9] text-white text-[13px] font-semibold hover:bg-[#5B21B6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    <Send className="w-4 h-4" strokeWidth={2.2} />{t("Publish schedule")}</button>
                )}

                {schedule.status === "published" && (
                  <button
                    onClick={close}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg border border-[#E5E7EB] bg-white text-[13px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB] transition-colors"
                  >
                    <Lock className="w-4 h-4" strokeWidth={2.2} />{t("Close")}</button>
                )}
              </>
            )}

            <Link
              href={`/schedules?duplicate=${schedule.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg border border-[#E5E7EB] bg-white text-[13px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB] transition-colors"
            >
              <Copy className="w-4 h-4" strokeWidth={2.2} />{t("Duplicate")}</Link>

            {schedule.status === "draft" && (
              <button
                onClick={() => setConfirmDeleteSchedule(true)}
                className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg border border-[#EF4444]/30 bg-white text-[13px] font-semibold text-[#B91C1C] hover:bg-[#EF4444]/5 transition-colors ml-auto"
              >
                <Trash2 className="w-4 h-4" strokeWidth={2.2} />{t("Delete schedule")}</button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {slots.map((slot) => (
            <section key={slot.function_id} className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
              <header className="px-5 h-12 flex items-center justify-between gap-3 border-b border-[#F1F1F4]">
                <div className="flex items-center gap-2 min-w-0">
                  {slot.is_leadership && <Crown className="w-4 h-4 text-[#B45309] shrink-0" />}
                  <h2 className="text-[13px] font-bold text-[#1A1A2E] truncate">{slot.function_name}</h2>
                  <span
                    className={`text-[11px] font-semibold tabular-nums ${
                      slot.missing > 0 ? "text-[#B45309]" : "text-[#047857]"
                    }`}
                  >
                    {slot.filled}/{slot.needed}
                  </span>
                </div>

                {editable && slot.missing > 0 && (
                  <button
                    onClick={() => setPickerFor({ functionId: slot.function_id, functionName: slot.function_name })}
                    className="inline-flex items-center gap-1 px-3 h-8 rounded-lg bg-[#F4EEFF] text-[#6D28D9] text-[12px] font-semibold hover:bg-[#EDE0FF] transition-colors shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" strokeWidth={2.6} />{t("Assign")}</button>
                )}
              </header>

              {slot.assignments.length === 0 ? (
                <p className="px-5 py-5 text-[12px] text-[#9CA3AF]">{t("No volunteer scheduled for this function.")}</p>
              ) : (
                <ul className="divide-y divide-[#F1F1F4]">
                  {slot.assignments.map((assignment) => (
                    <li key={assignment.id} className="px-5 py-3 flex items-center gap-3">
                      <VolunteerAvatar name={assignment.volunteer_name} photoUrl={assignment.volunteer_photo_url} size={32} />

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/volunteers/${assignment.volunteer_id}`}
                          className="text-[13px] font-semibold text-[#1A1A2E] hover:text-[#6D28D9] hover:underline truncate block"
                        >
                          {assignment.volunteer_name}
                        </Link>
                        {assignment.decline_reason && (
                          <p className="text-[11px] text-[#B91C1C] mt-0.5 truncate">
                            Recusou: {assignment.decline_reason}
                          </p>
                        )}
                      </div>

                      <StatusBadge status={assignment.status} />
                      {assignment.attendance_status !== "pending" && (
                        <StatusBadge status={assignment.attendance_status} />
                      )}

                      {editable && (
                        <button
                          onClick={() => setRemoving({ id: assignment.id, name: assignment.volunteer_name })}
                          className="w-8 h-8 rounded-lg bg-[#EF4444]/10 flex items-center justify-center hover:bg-[#EF4444]/20 transition-colors shrink-0"
                          aria-label={`Remover ${assignment.volunteer_name} da escala`}
                        >
                          <UserMinus className="w-3.5 h-3.5 text-[#EF4444]" strokeWidth={2.2} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </main>

      <CandidatePicker
        open={Boolean(pickerFor)}
        onClose={() => setPickerFor(null)}
        scheduleId={id}
        functionId={pickerFor?.functionId ?? null}
        functionName={pickerFor?.functionName ?? ""}
        onPick={assign}
        picking={busy}
      />

      <DeleteModal
        isOpen={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={removeAssignment}
        itemName={removing?.name}
        title={t("Remove from schedule")}
        description={t("The volunteer leaves this schedule and the slot opens up again.")}
        isLoading={busy}
      />

      <DeleteModal
        isOpen={confirmDeleteSchedule}
        onClose={() => setConfirmDeleteSchedule(false)}
        onConfirm={destroy}
        itemName={schedule.name}
        description={t("The schedule and its draft assignments will be deleted.")}
        isLoading={busy}
      />
    </>
  );
}
