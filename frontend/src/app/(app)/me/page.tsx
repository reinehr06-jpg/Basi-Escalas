"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  CalendarClock, CheckCircle2, XCircle, Repeat2, MapPin, CalendarOff, Award,
} from "lucide-react";
import StatusBadge from "@/components/escalas/StatusBadge";
import EmptyState from "@/components/escalas/EmptyState";
import Modal from "@/components/Modal";
import { MeService } from "@/services/escalas-dashboard.service";
import { AssignmentsService } from "@/services/assignments.service";
import { SwapsService } from "@/services/swaps.service";
import type { MyDashboard } from "@/types/escalas";
import { formatEventStamp, relativeDays } from "@/lib/escalas-format";

/** Módulo 15 — o que o voluntário vê: a própria agenda e o que depende dele. */
export default function MyPanelPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<MyDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [declining, setDeclining] = useState<{ id: string; title: string } | null>(null);
  const [reason, setReason] = useState("");
  const [swapping, setSwapping] = useState<{ id: string; title: string } | null>(null);
  const [swapReason, setSwapReason] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setData(await MeService.dashboard());
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível carregar sua agenda.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const confirm = async (id: string) => {
    setBusy(true);
    try {
      const res = await AssignmentsService.confirm(id);
      toast.success(res.message);
      load();
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível confirmar.");
    } finally {
      setBusy(false);
    }
  };

  const decline = async () => {
    if (!declining || !reason.trim()) return;
    setBusy(true);
    try {
      const res = await AssignmentsService.decline(declining.id, reason.trim());
      toast.success(res.message);
      setDeclining(null);
      setReason("");
      load();
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível registrar a recusa.");
    } finally {
      setBusy(false);
    }
  };

  const requestSwap = async () => {
    if (!swapping || !swapReason.trim()) return;
    setBusy(true);
    try {
      const res = await SwapsService.create({ assignment_id: swapping.id, reason: swapReason.trim() });
      toast.success(res.message);
      setSwapping(null);
      setSwapReason("");
      load();
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível abrir o pedido.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <main className="p-6 flex-1"><div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center text-sm text-[#6B7280]">{t("Loading...")}</div></main>;
  }

  if (!data?.volunteer) {
    return (
      <main className="p-6 flex-1">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
          <EmptyState
            icon={CalendarClock}
            title={t("Your user is not linked to a volunteer yet")}
            description={t("Ask the coordination to link your access to your volunteer record.")}
          />
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="p-4 md:py-5 px-4 md:px-8 flex-1 flex flex-col max-w-screen-2xl mx-auto w-full gap-4">
        <div className="bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] rounded-[16px] p-[16px_20px] flex flex-col xl:flex-row xl:items-center justify-between gap-[16px] shadow-[0_4px_16px_rgba(124,58,237,0.3)]">
          <div className="flex items-center gap-[12px] flex-1">
            <div className="w-[40px] h-[40px] rounded-[10px] bg-white/15 border border-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <CalendarClock className="w-[20px] h-[20px] text-white" strokeWidth={2.2} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[18px] sm:text-[22px] font-[800] text-white leading-tight drop-shadow-sm tracking-tight">
                Olá, {data.volunteer.name.split(" ")[0]}
              </h1>
              <p className="text-[11px] sm:text-[12px] text-purple-200 mt-0.5">{t("Your next assignments and what depends on you.")}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] shrink-0">
          {[
            { icon: CalendarClock, label: t("Upcoming"), hint: "escalas confirmadas e pendentes", value: data.stats.upcoming, tint: "#F4EEFF", color: "#7C3AED" },
            { icon: CheckCircle2, label: "A confirmar", hint: "esperando sua resposta", value: data.pending_confirmations, tint: "#FEF3C7", color: "#B45309" },
            { icon: Repeat2, label: "Trocas", hint: "abertas para você cobrir", value: data.swaps_open_to_me, tint: "#E0F2FE", color: "#0369A1" },
            { icon: Award, label: "Já servi", hint: "presenças registradas", value: data.stats.served_total, tint: "#ECFDF5", color: "#047857" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-[12px] border border-[#E5E7EB] p-[16px_18px] flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
            >
              <div className="flex flex-col overflow-hidden w-full">
                <span className="text-[12px] font-[600] text-[#6B7280] truncate">{stat.label}</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-[24px] font-[800] text-[#1A1A2E]">{stat.value}</span>
                </div>
                <span className="text-[11px] font-[600] text-[#6B7280] mt-0.5 truncate">{stat.hint}</span>
              </div>
              <div className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center shrink-0 ml-2" style={{ backgroundColor: stat.tint }}>
                <stat.icon className="w-[20px] h-[20px]" style={{ color: stat.color }} strokeWidth={2.4} />
              </div>
            </div>
          ))}
        </div>

        <section className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <header className="px-5 h-12 flex items-center justify-between border-b border-[#F1F1F4]">
            <h2 className="text-[13px] font-bold text-[#1A1A2E]">{t("My next assignments")}</h2>
            <Link href="/me/availability" className="text-[12px] font-semibold text-[#6D28D9] hover:underline">{t("My availability")}</Link>
          </header>

          {data.next_assignments.length === 0 ? (
            <EmptyState icon={CalendarClock} title={t("You are not scheduled for anything right now")} />
          ) : (
            <ul className="divide-y divide-[#F1F1F4]">
              {data.next_assignments.map((assignment) => (
                <li key={assignment.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <span
                    className="w-1.5 h-10 rounded-full shrink-0 hidden sm:block"
                    style={{ backgroundColor: assignment.ministry_color ?? "#6D28D9" }}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-semibold text-[#1A1A2E]">{assignment.event_title}</p>
                      <StatusBadge status={assignment.status} />
                    </div>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">
                      {assignment.ministry_name} · {assignment.function_name}
                    </p>
                    <p className="text-[11px] text-[#6B7280] mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>{formatEventStamp(assignment.starts_at)} · {relativeDays(assignment.starts_at)}</span>
                      {assignment.event_location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {assignment.event_location}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {assignment.can_confirm && (
                      <>
                        <button
                          onClick={() => confirm(assignment.id)}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-[#10B981] text-white text-[12px] font-semibold hover:bg-[#059669] disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" strokeWidth={2.2} />{t("Confirm")}</button>
                        <button
                          onClick={() => setDeclining({ id: assignment.id, title: assignment.event_title ?? "" })}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-[#E5E7EB] text-[12px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB] disabled:opacity-50 transition-colors"
                        >
                          <XCircle className="w-4 h-4" strokeWidth={2.2} />{t("I cannot")}</button>
                      </>
                    )}

                    {assignment.status === "confirmed" && (
                      <button
                        onClick={() => setSwapping({ id: assignment.id, title: assignment.event_title ?? "" })}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-[#E5E7EB] text-[12px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB] disabled:opacity-50 transition-colors"
                      >
                        <Repeat2 className="w-4 h-4" strokeWidth={2.2} />{t("Request swap")}</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {data.absences.length > 0 && (
          <section className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            <header className="px-5 h-12 flex items-center justify-between border-b border-[#F1F1F4]">
              <h2 className="text-[13px] font-bold text-[#1A1A2E]">{t("My absences")}</h2>
              <Link href="/me/absences" className="text-[12px] font-semibold text-[#6D28D9] hover:underline">{t("Manage")}</Link>
            </header>
            <ul className="divide-y divide-[#F1F1F4]">
              {data.absences.map((absence) => (
                <li key={absence.id} className="px-5 py-3 flex items-center gap-3">
                  <CalendarOff className="w-4 h-4 text-[#9CA3AF] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-[#1A1A2E]">{absence.reason}</p>
                    <p className="text-[11px] text-[#6B7280]">{relativeDays(absence.starts_at)}</p>
                  </div>
                  <StatusBadge status={absence.status} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <Modal open={Boolean(declining)} onClose={() => setDeclining(null)}>
        <div className="p-6 flex flex-col gap-4">
          <h2 className="text-[16px] font-bold text-[#1A1A2E]">{t("I cannot serve")}</h2>
          <p className="text-[13px] text-[#4B5563]">
            {t("The slot opens up again and leadership is notified.")} <strong>{declining?.title}</strong>
          </p>
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="decline-reason" className="text-[13px] font-[600] text-[#4B5563]">{t("Reason")}<span className="text-[#EF4444] ml-0.5">*</span>
            </label>
            <textarea
              id="decline-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="px-3 py-2.5 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9] resize-y"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeclining(null)} className="px-4 h-9 rounded-lg border border-[#E5E7EB] text-[13px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB] transition-colors">{t("Back")}</button>
            <button
              onClick={decline}
              disabled={!reason.trim() || busy}
              className="px-4 h-9 rounded-lg bg-[#EF4444] text-white text-[13px] font-semibold hover:bg-[#DC2626] disabled:opacity-50 transition-colors"
            >
              Confirmar recusa
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(swapping)} onClose={() => setSwapping(null)}>
        <div className="p-6 flex flex-col gap-4">
          <h2 className="text-[16px] font-bold text-[#1A1A2E]">{t("Request swap")}</h2>
          <p className="text-[13px] text-[#4B5563]">
            {t("Your request stays open to the other volunteers in the ministry. Leadership approves before it takes effect.")} <strong>{swapping?.title}</strong>
          </p>
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="swap-reason" className="text-[13px] font-[600] text-[#4B5563]">{t("Reason")}<span className="text-[#EF4444] ml-0.5">*</span>
            </label>
            <textarea
              id="swap-reason"
              value={swapReason}
              onChange={(e) => setSwapReason(e.target.value)}
              rows={3}
              className="px-3 py-2.5 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9] resize-y"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setSwapping(null)} className="px-4 h-9 rounded-lg border border-[#E5E7EB] text-[13px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB] transition-colors">{t("Back")}</button>
            <button
              onClick={requestSwap}
              disabled={!swapReason.trim() || busy}
              className="px-4 h-9 rounded-lg bg-[#6D28D9] text-white text-[13px] font-semibold hover:bg-[#5B21B6] disabled:opacity-50 transition-colors"
            >
              Enviar pedido
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
