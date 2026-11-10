"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  CalendarClock, CheckCircle2, XCircle, Repeat2, MapPin, CalendarOff, Award,
} from "lucide-react";
import PageHeader from "@/components/escalas/PageHeader";
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
    return <main className="p-6 flex-1"><div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center text-sm text-[#6B7280]">Carregando…</div></main>;
  }

  if (!data?.volunteer) {
    return (
      <main className="p-6 flex-1">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
          <EmptyState
            icon={CalendarClock}
            title="Seu usuário ainda não está vinculado a um voluntário"
            description="Peça à coordenação para vincular seu acesso ao seu cadastro de voluntário."
          />
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="p-6 pb-5 flex-1 flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
          <PageHeader
            icon={CalendarClock}
            title={`Olá, ${data.volunteer.name.split(" ")[0]}`}
            subtitle="Suas próximas escalas e o que depende de você."
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-6">
            {[
              { icon: CalendarClock, label: "Próximas escalas", value: data.stats.upcoming, tint: "#F4EEFF", color: "#7C3AED" },
              { icon: CheckCircle2, label: "A confirmar", value: data.pending_confirmations, tint: "#FEF3C7", color: "#B45309" },
              { icon: Repeat2, label: "Trocas abertas para mim", value: data.swaps_open_to_me, tint: "#E0F2FE", color: "#0369A1" },
              { icon: Award, label: "Vezes que servi", value: data.stats.served_total, tint: "#ECFDF5", color: "#047857" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-[#E5E7EB] p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: stat.tint }}>
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[20px] font-bold text-[#1A1A2E] leading-none tabular-nums">{stat.value}</p>
                  <p className="text-[11px] text-[#6B7280] mt-1 truncate">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <section className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <header className="px-5 h-12 flex items-center justify-between border-b border-[#F1F1F4]">
            <h2 className="text-[13px] font-bold text-[#1A1A2E]">Minhas próximas escalas</h2>
            <Link href="/me/availability" className="text-[12px] font-semibold text-[#6D28D9] hover:underline">
              Minha disponibilidade
            </Link>
          </header>

          {data.next_assignments.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Você não está escalado para nada no momento" />
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
                          <CheckCircle2 className="w-4 h-4" strokeWidth={2.2} />
                          Confirmar
                        </button>
                        <button
                          onClick={() => setDeclining({ id: assignment.id, title: assignment.event_title ?? "" })}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-[#E5E7EB] text-[12px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB] disabled:opacity-50 transition-colors"
                        >
                          <XCircle className="w-4 h-4" strokeWidth={2.2} />
                          Não posso
                        </button>
                      </>
                    )}

                    {assignment.status === "confirmed" && (
                      <button
                        onClick={() => setSwapping({ id: assignment.id, title: assignment.event_title ?? "" })}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-[#E5E7EB] text-[12px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB] disabled:opacity-50 transition-colors"
                      >
                        <Repeat2 className="w-4 h-4" strokeWidth={2.2} />
                        Pedir troca
                      </button>
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
              <h2 className="text-[13px] font-bold text-[#1A1A2E]">Minhas ausências</h2>
              <Link href="/me/absences" className="text-[12px] font-semibold text-[#6D28D9] hover:underline">
                Gerenciar
              </Link>
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
          <h2 className="text-[16px] font-bold text-[#1A1A2E]">Não poderei servir</h2>
          <p className="text-[13px] text-[#4B5563]">
            A vaga em <strong>{declining?.title}</strong> volta a ficar em aberto e a liderança é avisada.
          </p>
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="decline-reason" className="text-[13px] font-[600] text-[#4B5563]">
              Motivo <span className="text-[#EF4444] ml-0.5">*</span>
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
            <button onClick={() => setDeclining(null)} className="px-4 h-9 rounded-lg border border-[#E5E7EB] text-[13px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB] transition-colors">
              Voltar
            </button>
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
          <h2 className="text-[16px] font-bold text-[#1A1A2E]">Pedir troca</h2>
          <p className="text-[13px] text-[#4B5563]">
            Seu pedido em <strong>{swapping?.title}</strong> fica aberto para os outros voluntários do
            ministério. A liderança aprova antes de efetivar.
          </p>
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="swap-reason" className="text-[13px] font-[600] text-[#4B5563]">
              Motivo <span className="text-[#EF4444] ml-0.5">*</span>
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
            <button onClick={() => setSwapping(null)} className="px-4 h-9 rounded-lg border border-[#E5E7EB] text-[13px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB] transition-colors">
              Voltar
            </button>
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
