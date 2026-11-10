"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Users, CheckCheck, Repeat2, ClipboardList, ChevronRight,
  Sun, SunDim, Moon, UserRound,
} from "lucide-react";
import {
  Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import CustomDatePicker from "@/components/CustomDatePicker";
import { useAuth } from "@/context/AuthContext";
import { EscalasDashboardService } from "@/services/escalas-dashboard.service";
import { EscalasReportsService } from "@/services/escalas-reports.service";
import type { DashboardSummary } from "@/types/escalas";
import { formatDate } from "@/lib/escalas-format";

interface TrendPoint {
  name: string;
  scheduled: number;
  confirmed: number;
  present: number;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const todayObj = new Date();
  const startObj = new Date();
  startObj.setDate(todayObj.getDate() - 56); // 8 semanas de histórico
  const endObj = new Date();
  endObj.setDate(todayObj.getDate() + 56); // 8 semanas à frente
  const defaultStart = startObj.toISOString().split("T")[0];
  const defaultEnd = endObj.toISOString().split("T")[0];

  const [startDateFilter, setStartDateFilter] = useState(defaultStart);
  const [endDateFilter, setEndDateFilter] = useState(defaultEnd);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);

  const fetchDashboard = useCallback(async (start: string, end: string) => {
    if (start && end) {
      const diffDays = Math.ceil(
        Math.abs(new Date(end).getTime() - new Date(start).getTime()) / 86_400_000,
      );
      if (diffDays > 365) {
        toast.error(t("The maximum allowed interval is 365 days."));
        return;
      }
    }

    try {
      const [summaryRes, attendanceRes] = await Promise.all([
        EscalasDashboardService.summary({ from: start, to: end }),
        EscalasReportsService.attendance({ from: start, to: end }),
      ]);

      setSummary(summaryRes);
      setTrend(
        // Eventos sem ninguém escalado (ensaios, por exemplo) só serrilhariam a série.
        (attendanceRes.data ?? [])
          .filter((row) => row.scheduled > 0)
          .map((row) => ({
            name: formatDate(row.starts_at).slice(0, 5),
            scheduled: row.scheduled,
            confirmed: row.confirmed,
            present: row.present,
          })),
      );
    } catch (e) {
      const error = e as Error;
      console.error(t("Error fetching dashboard data"), error);
      toast.error(error.message || t("Error fetching dashboard data"));
    }
  }, [t]);

  useEffect(() => {
    fetchDashboard(defaultStart, defaultEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Good morning");
    else if (hour >= 12 && hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const getGreetingConfig = () => {
    if (greeting === "Good morning") {
      return {
        icon: <Sun className="w-[32px] h-[32px] text-white drop-shadow-sm" strokeWidth={2} />,
        bg: "bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_4px_14px_rgba(245,158,11,0.3)]",
      };
    }
    if (greeting === "Good afternoon") {
      return {
        icon: <SunDim className="w-[32px] h-[32px] text-white drop-shadow-sm" strokeWidth={2} />,
        bg: "bg-gradient-to-br from-sky-400 to-blue-500 shadow-[0_4px_14px_rgba(56,187,248,0.3)]",
      };
    }
    return {
      icon: <Moon className="w-[28px] h-[28px] text-white drop-shadow-sm" strokeWidth={2.2} />,
      bg: "bg-gradient-to-br from-[#3B0764] to-[#0F172A] shadow-[0_4px_14px_rgba(59,7,100,0.3)]",
    };
  };
  const greetingConfig = getGreetingConfig();

  const coverage = summary?.coverage;
  const confirmation = summary?.confirmation;

  const pieData = [
    { name: t("Confirmed"), value: confirmation?.confirmed ?? 0, color: "#10B981" },
    { name: t("Pending confirmations"), value: confirmation?.pending ?? 0, color: "#F59E0B" },
    { name: t("Declined"), value: confirmation?.declined ?? 0, color: "#EF4444" },
  ];

  const barData = (summary?.by_ministry ?? []).map((row) => ({
    name: row.name,
    pv: row.rate,
    ministryId: row.ministry_id,
  }));

  return (
    <>
      <main className="flex-grow flex flex-col p-[16px] sm:p-[20px_32px] relative">

        {/* HEADER & FILTERS */}
        <div className="bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] rounded-[16px] p-[16px_20px] flex flex-col xl:flex-row xl:items-center justify-between gap-[16px] shadow-[0_4px_16px_rgba(124,58,237,0.3)] mb-[16px]">

          <div className="flex items-center gap-[12px] flex-1">
            <div className={`w-[40px] h-[40px] rounded-[10px] flex items-center justify-center shrink-0 [&>svg]:!w-[20px] [&>svg]:!h-[20px] ${greetingConfig.bg}`}>
              {greetingConfig.icon}
            </div>
            <div className="flex flex-col">
              <h1 className="text-[18px] sm:text-[22px] font-[800] text-white leading-tight drop-shadow-sm tracking-tight">
                {t(greeting)}, {user?.name || ""}
              </h1>
              <p className="text-[11px] sm:text-[12px] text-purple-200 mt-0.5">
                {t("Here is how your church's schedules are doing today.")}
              </p>
            </div>
          </div>

          {/* FILTERS */}
          <div className="flex w-full xl:w-auto">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl p-[6px_10px] sm:p-[6px_14px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] w-full xl:w-auto ml-auto xl:ml-0 gap-2 sm:gap-0">
              <CustomDatePicker
                value={startDateFilter}
                onChange={(d) => setStartDateFilter(d)}
                label={t("Start")}
                variant="transparent"
              />

              <div className="hidden sm:block w-[1px] h-[18px] bg-white/20 mx-3 sm:mx-4"></div>

              <div className="border-t border-white/10 sm:border-0 pt-2 sm:pt-0">
                <CustomDatePicker
                  value={endDateFilter}
                  onChange={(d) => setEndDateFilter(d)}
                  label={t("End")}
                  variant="transparent"
                  align="right"
                />
              </div>

              <button
                type="button"
                onClick={() => fetchDashboard(startDateFilter, endDateFilter)}
                className="w-full sm:w-auto h-[34px] sm:h-[36px] mt-1 sm:mt-0 sm:ml-3 bg-white hover:bg-gray-50 active:scale-[0.98] text-[#7C3AED] text-[13px] font-[700] px-[18px] rounded-[10px] transition-all shadow-sm whitespace-nowrap cursor-pointer flex items-center justify-center"
              >
                {t("Filter")}
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex flex-col gap-[12px] pb-4">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] shrink-0">
            {/* Card 1: Cobertura das vagas */}
            <div
              className="bg-white rounded-[12px] border border-[#E5E7EB] p-[16px_18px] flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => { window.location.href = "/schedules"; }}
            >
              <div className="flex flex-col overflow-hidden w-full">
                <span className="text-[12px] font-[600] text-[#6B7280] truncate">{t("Coverage")}</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-[24px] font-[800] text-[#1A1A2E]">{coverage?.rate ?? 0}%</span>
                  <span className="text-[11px] font-[500] text-[#6B7280]">
                    {coverage?.filled ?? 0}/{coverage?.needed ?? 0}
                  </span>
                </div>
                <span className="text-[11px] font-[600] text-[#6B7280] mt-0.5 flex items-center gap-1 truncate">
                  {coverage?.missing
                    ? `${coverage.missing} ${t("open slots")}`
                    : t("All slots filled")}
                </span>
              </div>
              <div className="w-[42px] h-[42px] rounded-[10px] bg-[#F4EEFF] flex items-center justify-center shrink-0 ml-2">
                <ClipboardList className="w-[20px] h-[20px] text-[#7C3AED]" strokeWidth={2.4} />
              </div>
            </div>

            {/* Card 2: Confirmações pendentes */}
            <div
              className="bg-white rounded-[12px] border border-[#E5E7EB] p-[16px_18px] flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => { window.location.href = "/confirmations"; }}
            >
              <div className="flex flex-col overflow-hidden w-full">
                <span className="text-[12px] font-[600] text-[#6B7280] truncate">{t("To confirm")}</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-[24px] font-[800] text-[#1A1A2E]">{confirmation?.pending ?? 0}</span>
                  <span className="text-[11px] font-[500] text-[#6B7280]">{t("people")}</span>
                </div>
                <span className="text-[11px] font-[600] text-[#6B7280] mt-0.5 truncate">
                  {confirmation?.rate ?? 0}% {t("already confirmed")}
                </span>
              </div>
              <div className="w-[42px] h-[42px] rounded-[10px] bg-amber-50 flex items-center justify-center shrink-0 ml-2">
                <CheckCheck className="w-[20px] h-[20px] text-amber-600" strokeWidth={2.4} />
              </div>
            </div>

            {/* Card 3: Voluntários ativos */}
            <div
              className="bg-white rounded-[12px] border border-[#E5E7EB] p-[16px_18px] flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => { window.location.href = "/volunteers"; }}
            >
              <div className="flex flex-col overflow-hidden w-full">
                <span className="text-[12px] font-[600] text-[#6B7280] truncate">{t("Volunteers")}</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-[24px] font-[800] text-[#1A1A2E]">{summary?.cards.volunteers_active ?? 0}</span>
                </div>
                <span className="text-[11px] font-[600] text-[#6B7280] mt-0.5 flex items-center gap-1 truncate">
                  {summary?.cards.ministries ?? 0} {t("active ministries")}
                </span>
              </div>
              <div className="w-[42px] h-[42px] rounded-[10px] bg-green-50 flex items-center justify-center shrink-0 ml-2">
                <Users className="w-[20px] h-[20px] text-green-600" strokeWidth={2.4} />
              </div>
            </div>

            {/* Card 4: Trocas abertas */}
            <div
              className="bg-white rounded-[12px] border border-[#E5E7EB] p-[16px_18px] flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => { window.location.href = "/swaps"; }}
            >
              <div className="flex flex-col overflow-hidden w-full">
                <span className="text-[12px] font-[600] text-[#6B7280] truncate">{t("Swaps")}</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-[24px] font-[800] text-[#1A1A2E]">{summary?.cards.open_swaps ?? 0}</span>
                </div>
                <span className="text-[11px] font-[600] text-[#6B7280] mt-0.5 flex items-center gap-1 truncate">
                  {summary?.cards.pending_absences ?? 0} {t("absences to review")}
                </span>
              </div>
              <div className="w-[42px] h-[42px] rounded-[10px] bg-blue-50 flex items-center justify-center shrink-0 ml-2">
                <Repeat2 className="w-[20px] h-[20px] text-blue-600" strokeWidth={2.4} />
              </div>
            </div>
          </div>

          {/* ROW 2: Evolução das escalas + Status das confirmações */}
          <div className="flex flex-col lg:flex-row gap-[12px] shrink-0 items-stretch">
            <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-[16px_20px] flex-1 flex flex-col shadow-[0_2px_8px_rgba(0,0,0,0.02)] min-h-[300px] lg:min-h-[280px]">
              <div className="flex justify-between items-center mb-[12px] shrink-0">
                <span className="text-[14px] font-[700] text-[#1A1A2E]">{t("Schedules per service")}</span>
              </div>
              <div className="flex-1 w-full min-h-[180px] ml-[-24px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trend} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScheduled" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorConfirmed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9CA3AF" }} dy={5} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                    <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", fontSize: "11px", fontWeight: 500 }} />
                    <Area type="monotone" dataKey="scheduled" name={t("Scheduled")} stroke="#8B5CF6" fillOpacity={1} fill="url(#colorScheduled)" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                    <Area type="monotone" dataKey="confirmed" name={t("Confirmed")} stroke="#3B82F6" fillOpacity={1} fill="url(#colorConfirmed)" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="present" name={t("Attended")} stroke="#10B981" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 mt-4 shrink-0">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#8B5CF6]"></div><span className="text-[11px] font-[500] text-[#6B7280]">{t("Scheduled")}</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#3B82F6]"></div><span className="text-[11px] font-[500] text-[#6B7280]">{t("Confirmed")}</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#10B981]"></div><span className="text-[11px] font-[500] text-[#6B7280]">{t("Attended")}</span></div>
              </div>
            </div>

            {/* Donut: status das confirmações */}
            <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-[16px_20px] w-full lg:w-[340px] flex flex-col shadow-[0_2px_8px_rgba(0,0,0,0.02)] min-h-[300px] lg:min-h-[280px]">
              <span className="text-[14px] font-[700] text-[#1A1A2E] mb-[8px] shrink-0">{t("Confirmation status")}</span>
              <div className="flex-1 flex flex-col items-center justify-center relative min-h-0">
                <div className="w-[110px] h-[110px] mx-auto relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} innerRadius={38} outerRadius={55} paddingAngle={3} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                    <span className="text-[20px] font-[800] text-[#1A1A2E] leading-none">
                      {pieData.reduce((acc, curr) => acc + curr.value, 0)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                  {pieData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 w-[110px]">
                      <div className="w-[6px] h-[6px] rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                      <span className="text-[10px] font-[500] text-[#6B7280] truncate">{item.name}</span>
                      <span className="text-[10px] font-[700] text-[#1A1A2E] ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ROW 3: Escalas que precisam de atenção + Cobertura por ministério */}
          <div className="flex flex-col lg:flex-row gap-[12px] shrink-0 items-stretch">

            <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-[16px_20px] flex-1 flex flex-col shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden min-h-[260px] lg:min-h-[240px]">
              <div className="flex justify-between items-center mb-[8px] shrink-0">
                <span className="text-[14px] font-[700] text-[#1A1A2E]">{t("Schedules needing attention")}</span>
                <a href="/schedules" className="text-[11px] font-[600] text-[#7C3AED] hover:underline flex items-center gap-1">
                  {t("View all")} <ChevronRight className="w-3 h-3" />
                </a>
              </div>
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#F1F1F4]">
                      <th className="pb-2 text-[10px] font-[700] text-[#9CA3AF] uppercase sticky top-0 bg-white">{t("Roster")}</th>
                      <th className="pb-2 text-[10px] font-[700] text-[#9CA3AF] uppercase sticky top-0 bg-white">{t("Service")}</th>
                      <th className="pb-2 text-[10px] font-[700] text-[#9CA3AF] uppercase sticky top-0 bg-white">{t("Date")}</th>
                      <th className="pb-2 text-[10px] font-[700] text-[#9CA3AF] uppercase sticky top-0 bg-white">{t("Coverage")}</th>
                      <th className="pb-2 text-[10px] font-[700] text-[#9CA3AF] uppercase text-right sticky top-0 bg-white">{t("Status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(summary?.attention ?? []).map((item) => (
                      <tr
                        key={item.schedule_id}
                        className="border-b border-[#F1F1F4] last:border-0 hover:bg-[#F9FAFB] cursor-pointer"
                        onClick={() => { window.location.href = `/schedules/${item.schedule_id}`; }}
                      >
                        <td className="py-2.5 text-[12px] font-[600] text-[#1A1A2E] flex items-center gap-2">
                          <div className="w-[20px] h-[20px] rounded-full bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                            <UserRound className="w-2.5 h-2.5 text-gray-400" />
                          </div>
                          {item.name}
                        </td>
                        <td className="py-2.5 text-[11px] font-[500] text-[#4B5563] truncate max-w-[150px]">{item.event_title}</td>
                        <td className="py-2.5 text-[11px] font-[500] text-[#4B5563]">{formatDate(item.starts_at)}</td>
                        <td className="py-2.5 text-[11px] font-[500] text-[#6D28D9]">{item.filled}/{item.needed}</td>
                        <td className="py-2.5 text-right">
                          <span className={`inline-block px-1.5 py-0.5 rounded-[4px] text-[10px] font-[700] tracking-wide ${
                            item.missing > 0 ? "text-[#D97706] bg-[#FEF3C7]" : "text-[#059669] bg-[#D1FAE5]"
                          }`}>
                            {item.missing > 0 ? `${item.missing} ${t("missing")}` : t("Draft")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cobertura por ministério */}
            <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-[16px_20px] w-full lg:w-[340px] flex flex-col shadow-[0_2px_8px_rgba(0,0,0,0.02)] min-h-[260px] lg:min-h-[240px]">
              <div className="flex justify-between items-center mb-[12px] shrink-0">
                <span className="text-[14px] font-[700] text-[#1A1A2E]">{t("Coverage by ministry")}</span>
                <select className="text-[11px] text-[#6B7280] outline-none bg-transparent">
                  <option>{t("Filled rate")}</option>
                </select>
              </div>
              <div className="flex-1 w-full min-h-[160px] ml-[-20px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9CA3AF" }} dy={5} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9CA3AF" }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip cursor={{ fill: "#F4EEFF" }} contentStyle={{ borderRadius: "8px", border: "none", fontSize: "11px" }} />
                    <Bar
                      dataKey="pv"
                      name={t("Coverage")}
                      fill="#7C3AED"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                      onClick={(data) => {
                        // O payload do Recharts carrega a linha original da série.
                        const ministryId = (data as unknown as { payload?: { ministryId?: string } })?.payload?.ministryId;
                        if (ministryId) window.location.href = `/ministries/${ministryId}`;
                      }}
                      className="cursor-pointer"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
