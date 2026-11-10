"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard, CalendarDays, ClipboardList, Users, Repeat2,
  CalendarOff, TriangleAlert, ArrowRight, CheckCheck, UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/escalas/PageHeader";
import CoverageBar from "@/components/escalas/CoverageBar";
import StatusBadge from "@/components/escalas/StatusBadge";
import EmptyState from "@/components/escalas/EmptyState";
import { EscalasDashboardService } from "@/services/escalas-dashboard.service";
import type { DashboardSummary } from "@/types/escalas";
import { formatEventStamp, relativeDays } from "@/lib/escalas-format";

function monthBounds() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const first = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    from: first,
    to: `${last.getFullYear()}-${pad(last.getMonth() + 1)}-${pad(last.getDate())}`,
  };
}

function Card({
  icon: Icon, label, value, href, tint, color,
}: {
  icon: typeof Users; label: string; value: number | string;
  href?: string; tint: string; color: string;
}) {
  const body = (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-4 flex items-center gap-3 h-full transition-colors hover:border-[#D1D5DB]">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: tint }}>
        <Icon className="w-4.5 h-4.5" strokeWidth={2.2} style={{ color, width: 18, height: 18 }} />
      </div>
      <div className="min-w-0">
        <p className="text-[22px] font-bold text-[#1A1A2E] leading-none tabular-nums">{value}</p>
        <p className="text-[11px] text-[#6B7280] mt-1 truncate">{label}</p>
      </div>
    </div>
  );

  return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}

function RateBlock({
  title, main, caption, parts,
}: {
  title: string; main: string; caption: string;
  parts: { label: string; value: number; color: string }[];
}) {
  const total = parts.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
      <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wide">{title}</p>
      <p className="text-[28px] font-bold text-[#1A1A2E] leading-tight mt-1 tabular-nums">{main}</p>
      <p className="text-[11px] text-[#6B7280]">{caption}</p>

      <div className="flex h-2 rounded-full overflow-hidden bg-[#F1F1F4] mt-4">
        {total > 0 &&
          parts.map((part) => (
            <div
              key={part.label}
              style={{ width: `${(part.value / total) * 100}%`, backgroundColor: part.color }}
              title={`${part.label}: ${part.value}`}
            />
          ))}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {parts.map((part) => (
          <span key={part.label} className="flex items-center gap-1.5 text-[11px] text-[#4B5563]">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: part.color }} />
            {part.label}
            <strong className="text-[#1A1A2E] tabular-nums">{part.value}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(monthBounds);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setData(await EscalasDashboardService.summary(period));
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || "Não foi possível carregar o dashboard.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="p-6 pb-5 flex-1 flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
        <PageHeader
          icon={LayoutDashboard}
          title="Dashboard"
          subtitle="Cobertura, confirmações e presença das escalas no período."
          actions={
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={period.from}
                onChange={(e) => setPeriod((p) => ({ ...p, from: e.target.value }))}
                className="h-9 px-2.5 rounded-lg border border-[#E5E7EB] text-[12px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
                aria-label="Início do período"
              />
              <span className="text-[#9CA3AF] text-xs">até</span>
              <input
                type="date"
                value={period.to}
                onChange={(e) => setPeriod((p) => ({ ...p, to: e.target.value }))}
                className="h-9 px-2.5 rounded-lg border border-[#E5E7EB] text-[12px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
                aria-label="Fim do período"
              />
            </div>
          }
        />
        <div className="h-6" />
      </div>

      {loading && !data ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-10 text-center text-sm text-[#6B7280]">
          Carregando…
        </div>
      ) : !data ? null : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <Card icon={CalendarDays} label="Eventos no período" value={data.cards.events} href="/events" tint="#EEF2FF" color="#4F46E5" />
            <Card icon={ClipboardList} label="Escalas" value={data.cards.schedules} href="/schedules" tint="#F4EEFF" color="#7C3AED" />
            <Card icon={TriangleAlert} label="Rascunhos" value={data.cards.drafts} href="/schedules?status=draft" tint="#FEF3C7" color="#B45309" />
            <Card icon={Users} label="Voluntários ativos" value={data.cards.volunteers_active} href="/volunteers" tint="#ECFDF5" color="#047857" />
            <Card icon={Repeat2} label="Trocas abertas" value={data.cards.open_swaps} href="/swaps?status=open" tint="#E0F2FE" color="#0369A1" />
            <Card icon={CalendarOff} label="Ausências a revisar" value={data.cards.pending_absences} href="/absences?status=pending" tint="#FEE2E2" color="#B91C1C" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <RateBlock
              title="Cobertura das vagas"
              main={`${data.coverage.rate}%`}
              caption={`${data.coverage.filled} de ${data.coverage.needed} vagas preenchidas`}
              parts={[
                { label: "Preenchidas", value: data.coverage.filled, color: "#10B981" },
                { label: "Em aberto", value: data.coverage.missing, color: "#E5E7EB" },
              ]}
            />
            <RateBlock
              title="Confirmações"
              main={`${data.confirmation.rate}%`}
              caption={`${data.confirmation.confirmed} confirmados`}
              parts={[
                { label: "Confirmados", value: data.confirmation.confirmed, color: "#10B981" },
                { label: "Pendentes", value: data.confirmation.pending, color: "#F59E0B" },
                { label: "Recusados", value: data.confirmation.declined, color: "#EF4444" },
              ]}
            />
            <RateBlock
              title="Presença"
              main={`${data.attendance.rate}%`}
              caption={`${data.attendance.present} presenças registradas`}
              parts={[
                { label: "Presentes", value: data.attendance.present, color: "#10B981" },
                { label: "Faltas", value: data.attendance.absent, color: "#EF4444" },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <section className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
              <header className="px-5 h-12 flex items-center justify-between border-b border-[#F1F1F4]">
                <h2 className="text-[13px] font-bold text-[#1A1A2E]">Cobertura por ministério</h2>
                <Link href="/reports" className="text-[12px] font-semibold text-[#6D28D9] hover:underline flex items-center gap-1">
                  Relatórios <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </header>

              {data.by_ministry.length === 0 ? (
                <EmptyState icon={ClipboardList} title="Nenhuma escala no período" description="Crie escalas para acompanhar a cobertura por ministério." />
              ) : (
                <ul className="divide-y divide-[#F1F1F4]">
                  {data.by_ministry.map((row) => (
                    <li key={row.ministry_id} className="px-5 py-3 flex items-center gap-3 hover:bg-[#FAFAFC] transition-colors">
                      <span className="w-2 h-8 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[13px] font-semibold text-[#1A1A2E] truncate">{row.name}</p>
                          <span className="text-[11px] text-[#6B7280] shrink-0">{row.schedules} escala(s)</span>
                        </div>
                        <div className="mt-1.5">
                          <CoverageBar filled={row.filled} needed={row.needed} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
              <header className="px-5 h-12 flex items-center justify-between border-b border-[#F1F1F4]">
                <h2 className="text-[13px] font-bold text-[#1A1A2E]">Precisa de atenção</h2>
                <Link href="/schedules" className="text-[12px] font-semibold text-[#6D28D9] hover:underline flex items-center gap-1">
                  Ver escalas <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </header>

              {data.attention.length === 0 ? (
                <EmptyState icon={CheckCheck} title="Tudo em dia" description="Nenhuma escala dos próximos 14 dias está incompleta ou em rascunho." />
              ) : (
                <ul className="divide-y divide-[#F1F1F4]">
                  {data.attention.map((row) => (
                    <li key={row.schedule_id}>
                      <Link
                        href={`/schedules/${row.schedule_id}`}
                        className="px-5 py-3 flex items-center gap-3 hover:bg-[#FAFAFC] transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-semibold text-[#1A1A2E] truncate">{row.name}</p>
                            <StatusBadge status={row.status} />
                          </div>
                          <p className="text-[11px] text-[#6B7280] mt-0.5">
                            {formatEventStamp(row.starts_at)}
                            {relativeDays(row.starts_at) ? ` · ${relativeDays(row.starts_at)}` : ""}
                          </p>
                        </div>
                        {row.missing > 0 && (
                          <span className="text-[11px] font-bold text-[#B91C1C] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-md px-2 h-[22px] flex items-center shrink-0">
                            faltam {row.missing}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            <header className="px-5 h-12 flex items-center justify-between border-b border-[#F1F1F4]">
              <h2 className="text-[13px] font-bold text-[#1A1A2E]">Próximos eventos</h2>
              <Link href="/events" className="text-[12px] font-semibold text-[#6D28D9] hover:underline flex items-center gap-1">
                Calendário <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </header>

            {data.upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Nenhum evento agendado"
                description="Cadastre cultos, ensaios e eventos para começar a escalar."
                action={
                  <Link href="/events/new" className="inline-flex items-center justify-center px-4 h-9 bg-[#6D28D9] text-white text-[13px] font-semibold rounded-lg hover:bg-[#5B21B6] transition-colors">
                    Novo evento
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-[#F1F1F4]">
                {data.upcoming.map((event) => (
                  <li key={event.id}>
                    <Link href={`/events/${event.id}`} className="px-5 py-3 flex items-center gap-4 hover:bg-[#FAFAFC] transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-[#1A1A2E] truncate">{event.title}</p>
                        <p className="text-[11px] text-[#6B7280] mt-0.5">
                          {formatEventStamp(event.starts_at)}
                          {event.location ? ` · ${event.location}` : ""}
                        </p>
                      </div>
                      <div className="w-32 shrink-0 hidden sm:block">
                        <CoverageBar filled={event.filled} needed={event.needed} />
                      </div>
                      <UserCheck className="w-4 h-4 text-[#9CA3AF] shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
