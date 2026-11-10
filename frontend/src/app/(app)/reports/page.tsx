"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { BarChart3 } from "lucide-react";
import PageHeader from "@/components/escalas/PageHeader";
import CoverageBar from "@/components/escalas/CoverageBar";
import VolunteerAvatar from "@/components/escalas/VolunteerAvatar";
import ResponsiveTableCard from "@/components/ResponsiveTableCard";
import EmptyState from "@/components/escalas/EmptyState";
import { usePersistedState } from "@/hooks/usePersistedState";
import {
  EscalasReportsService,
  type AttendanceReportRow,
  type MinistryReportRow,
  type VolunteerReportRow,
} from "@/services/escalas-reports.service";
import { formatEventStamp } from "@/lib/escalas-format";

type Tab = "volunteers" | "ministries" | "attendance" | "swaps";

const TABS: { id: Tab; label: string }[] = [
  { id: "volunteers", label: "Volunteers" },
  { id: "ministries", label: "Ministries" },
  { id: "attendance", label: "Attendance per event" },
  { id: "swaps", label: "Swaps" },
];

function Rate({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[12px] text-[#9CA3AF]">—</span>;
  const color = value >= 80 ? "#047857" : value >= 50 ? "#B45309" : "#B91C1C";
  return <span className="text-[12px] font-bold tabular-nums" style={{ color }}>{value}%</span>;
}

function defaultPeriod() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  return {
    from: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-01`,
    to: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())}`,
  };
}

/** Módulo 14 — indicadores de engajamento, cobertura, presença e atrito. */
export default function ReportsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = usePersistedState<Tab>("reports:tab", "volunteers");
  const [period, setPeriod] = useState(defaultPeriod);
  const [loading, setLoading] = useState(true);

  const [volunteers, setVolunteers] = useState<VolunteerReportRow[]>([]);
  const [ministries, setMinistries] = useState<MinistryReportRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceReportRow[]>([]);
  const [swaps, setSwaps] = useState<Awaited<ReturnType<typeof EscalasReportsService.swaps>> | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      if (tab === "volunteers") setVolunteers((await EscalasReportsService.volunteers(period)).data);
      if (tab === "ministries") setMinistries((await EscalasReportsService.ministries(period)).data);
      if (tab === "attendance") setAttendance((await EscalasReportsService.attendance(period)).data);
      if (tab === "swaps") setSwaps(await EscalasReportsService.swaps(period));
    } catch (err) {
      toast.error((err as Error).message || t("Could not load the report."));
    } finally {
      setLoading(false);
    }
  }, [tab, period]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="p-6 pb-5 flex-1 flex flex-col">
      <div className="bg-white rounded-2xl flex-1 border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
        <PageHeader
          icon={BarChart3}
          title={t("Reports and indicators")}
          subtitle={t("Volunteer engagement, ministry coverage and attendance.")}
          actions={
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={period.from}
                onChange={(e) => setPeriod((p) => ({ ...p, from: e.target.value }))}
                className="h-9 px-2.5 rounded-lg border border-[#E5E7EB] text-[12px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
                aria-label={t("Start of period")}
              />
              <span className="text-[#9CA3AF] text-xs">até</span>
              <input
                type="date"
                value={period.to}
                onChange={(e) => setPeriod((p) => ({ ...p, to: e.target.value }))}
                className="h-9 px-2.5 rounded-lg border border-[#E5E7EB] text-[12px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
                aria-label={t("End of period")}
              />
            </div>
          }
        />

        <div className="px-6 pt-5">
          <div className="flex gap-1 border-b border-[#F1F1F4] overflow-x-auto">
            {TABS.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                aria-current={tab === item.id ? "page" : undefined}
                className={`px-3.5 h-9 text-[13px] font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  tab === item.id
                    ? "border-[#6D28D9] text-[#6D28D9]"
                    : "border-transparent text-[#6B7280] hover:text-[#1A1A2E]"
                }`}
              >
                {t(item.label)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-[#6B7280]">{t("Loading...")}</div>
        ) : tab === "volunteers" ? (
          volunteers.length === 0 ? (
            <EmptyState icon={BarChart3} title={t("No assignments in the period")} />
          ) : (
            <ResponsiveTableCard minWidth="760px">
              <div className="grid grid-cols-[1fr_90px_90px_90px_110px_110px] items-center px-6 h-10 border-b border-[#F1F1F4] bg-[#FCFCFD] mt-4">
                <span className="text-xs font-bold text-[#6B7280]">{t("Volunteer")}</span>
                <span className="text-xs font-bold text-[#6B7280] text-center">Escalado</span>
                <span className="text-xs font-bold text-[#6B7280] text-center">Presente</span>
                <span className="text-xs font-bold text-[#6B7280] text-center">{t("Absences count")}</span>
                <span className="text-xs font-bold text-[#6B7280] text-center">{t("Confirmation")}</span>
                <span className="text-xs font-bold text-[#6B7280] text-center">{t("Attendance")}</span>
              </div>
              {volunteers.map((row) => (
                <div key={row.volunteer_id} className="grid grid-cols-[1fr_90px_90px_90px_110px_110px] items-center px-6 min-h-[46px] py-1.5 border-b border-[#F1F1F4] hover:bg-[#FAFAFC] transition-colors last:border-b-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <VolunteerAvatar name={row.name} photoUrl={row.photo_url} size={26} />
                    <Link href={`/volunteers/${row.volunteer_id}`} className="text-[13px] font-[600] text-[#1A1A2E] hover:text-[#6D28D9] hover:underline truncate">
                      {row.name}
                    </Link>
                  </div>
                  <span className="text-[12px] text-center tabular-nums text-[#4B5563]">{row.scheduled}</span>
                  <span className="text-[12px] text-center tabular-nums text-[#047857]">{row.present}</span>
                  <span className="text-[12px] text-center tabular-nums text-[#B91C1C]">{row.absent}</span>
                  <div className="text-center"><Rate value={row.confirmation_rate} /></div>
                  <div className="text-center"><Rate value={row.attendance_rate} /></div>
                </div>
              ))}
            </ResponsiveTableCard>
          )
        ) : tab === "ministries" ? (
          ministries.length === 0 ? (
            <EmptyState icon={BarChart3} title={t("No data in the period")} />
          ) : (
            <ul className="divide-y divide-[#F1F1F4] border-t border-[#F1F1F4] mt-4">
              {ministries.map((row) => (
                <li key={row.ministry_id} className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="w-1.5 h-9 rounded-full shrink-0" style={{ backgroundColor: row.color ?? "#6D28D9" }} />
                    <div className="min-w-0">
                      <Link href={`/ministries/${row.ministry_id}`} className="text-[13px] font-semibold text-[#1A1A2E] hover:text-[#6D28D9] hover:underline">
                        {row.name}
                      </Link>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">
                        {row.volunteers} voluntário(s) · {row.functions} função(ões) · {row.schedules} escala(s)
                      </p>
                    </div>
                  </div>

                  <div className="w-full sm:w-[200px] shrink-0">
                    <CoverageBar filled={row.filled} needed={row.needed} />
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-center">
                      <p className="text-[10px] text-[#9CA3AF] uppercase font-semibold">Cobertura</p>
                      <Rate value={row.coverage_rate} />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-[#9CA3AF] uppercase font-semibold">{t("Attendance")}</p>
                      <Rate value={row.attendance_rate} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : tab === "attendance" ? (
          attendance.length === 0 ? (
            <EmptyState icon={BarChart3} title={t("No event in the period")} />
          ) : (
            <ResponsiveTableCard minWidth="700px">
              <div className="grid grid-cols-[1fr_90px_90px_90px_110px] items-center px-6 h-10 border-b border-[#F1F1F4] bg-[#FCFCFD] mt-4">
                <span className="text-xs font-bold text-[#6B7280]">{t("Event")}</span>
                <span className="text-xs font-bold text-[#6B7280] text-center">Escalados</span>
                <span className="text-xs font-bold text-[#6B7280] text-center">Presentes</span>
                <span className="text-xs font-bold text-[#6B7280] text-center">{t("Absences count")}</span>
                <span className="text-xs font-bold text-[#6B7280] text-center">{t("Attendance")}</span>
              </div>
              {attendance.map((row) => (
                <div key={row.event_id} className="grid grid-cols-[1fr_90px_90px_90px_110px] items-center px-6 min-h-[46px] py-1.5 border-b border-[#F1F1F4] hover:bg-[#FAFAFC] transition-colors last:border-b-0">
                  <div className="min-w-0">
                    <Link href={`/events/${row.event_id}`} className="text-[13px] font-[600] text-[#1A1A2E] hover:text-[#6D28D9] hover:underline truncate block">
                      {row.title}
                    </Link>
                    <p className="text-[11px] text-[#6B7280]">{formatEventStamp(row.starts_at)}</p>
                  </div>
                  <span className="text-[12px] text-center tabular-nums text-[#4B5563]">{row.scheduled}</span>
                  <span className="text-[12px] text-center tabular-nums text-[#047857]">{row.present}</span>
                  <span className="text-[12px] text-center tabular-nums text-[#B91C1C]">{row.absent}</span>
                  <div className="text-center"><Rate value={row.attendance_rate} /></div>
                </div>
              ))}
            </ResponsiveTableCard>
          )
        ) : !swaps ? null : (
          <div className="p-6 flex flex-col gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: "Total", value: swaps.totals.total },
                { label: "Abertas", value: swaps.totals.open },
                { label: "Aprovadas", value: swaps.totals.approved },
                { label: "Recusadas", value: swaps.totals.rejected },
                { label: "Canceladas", value: swaps.totals.cancelled },
              ].map((card) => (
                <div key={card.label} className="rounded-xl border border-[#E5E7EB] p-3.5">
                  <p className="text-[11px] text-[#9CA3AF] uppercase font-semibold">{card.label}</p>
                  <p className="text-[20px] font-bold text-[#1A1A2E] mt-1 tabular-nums">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
                <header className="px-4 h-10 flex items-center border-b border-[#F1F1F4] bg-[#FCFCFD]">
                  <h2 className="text-[12px] font-bold text-[#6B7280]">{t("By ministry")}</h2>
                </header>
                {swaps.by_ministry.length === 0 ? (
                  <p className="p-5 text-center text-[12px] text-[#9CA3AF]">{t("No swaps in the period.")}</p>
                ) : (
                  <ul className="divide-y divide-[#F1F1F4]">
                    {swaps.by_ministry.map((row) => (
                      <li key={row.ministry_id} className="px-4 py-2.5 flex items-center justify-between">
                        <span className="text-[13px] text-[#1A1A2E]">{row.name}</span>
                        <span className="text-[13px] font-bold text-[#4B5563] tabular-nums">{row.total}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
                <header className="px-4 h-10 flex items-center border-b border-[#F1F1F4] bg-[#FCFCFD]">
                  <h2 className="text-[12px] font-bold text-[#6B7280]">Quem mais pede troca</h2>
                </header>
                {swaps.top_requesters.length === 0 ? (
                  <p className="p-5 text-center text-[12px] text-[#9CA3AF]">{t("No swaps in the period.")}</p>
                ) : (
                  <ul className="divide-y divide-[#F1F1F4]">
                    {swaps.top_requesters.map((row) => (
                      <li key={row.volunteer_id} className="px-4 py-2.5 flex items-center justify-between">
                        <Link href={`/volunteers/${row.volunteer_id}`} className="text-[13px] text-[#1A1A2E] hover:text-[#6D28D9] hover:underline">
                          {row.name}
                        </Link>
                        <span className="text-[13px] font-bold text-[#4B5563] tabular-nums">{row.total}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
