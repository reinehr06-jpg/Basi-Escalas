"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  CalendarDays, Plus, ChevronLeft, ChevronRight, List, Grid3x3, MapPin,
} from "lucide-react";
import PageHeader from "@/components/escalas/PageHeader";
import StatusBadge from "@/components/escalas/StatusBadge";
import EmptyState from "@/components/escalas/EmptyState";
import CustomSelect from "@/components/CustomSelect";
import { usePersistedState } from "@/hooks/usePersistedState";
import { EventsService } from "@/services/events.service";
import { MinistriesService } from "@/services/ministries.service";
import type { CalendarEvent, Ministry } from "@/types/escalas";
import { EVENT_TYPE_LABELS, formatTime, formatEventStamp } from "@/lib/escalas-format";

/** Nomes de mês e iniciais de dia vêm do locale, não de uma lista fixa. */
const MONTH_LABEL = new Intl.DateTimeFormat("pt-BR", { month: "long" });
const WEEKDAY_INITIALS = Array.from({ length: 7 }, (_, i) =>
  new Intl.DateTimeFormat("pt-BR", { weekday: "narrow" })
    .format(new Date(Date.UTC(2024, 0, 7 + i)))
    .toUpperCase(),
);

const TYPE_TINT: Record<string, string> = {
  service: "#6D28D9",
  rehearsal: "#0EA5E9",
  event: "#F59E0B",
  meeting: "#10B981",
  other: "#6B7280",
};

function iso(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function EventsPage() {
  const { t } = useTranslation();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [view, setView] = usePersistedState<"month" | "list">("events:view", "month");
  const [ministryId, setMinistryId] = usePersistedState("events:ministry", "");
  const [typeFilter, setTypeFilter] = usePersistedState("events:type", "");

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    MinistriesService.list({ itemsPerPage: 200 })
      .then((res) => setMinistries(res.data ?? []))
      .catch(() => setMinistries([]));
  }, []);

  const range = useMemo(() => {
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    return { start: iso(start), end: iso(end) };
  }, [cursor]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await EventsService.range(range.start, range.end, {
        ministry_id: ministryId || undefined,
        type: typeFilter || undefined,
      });
      setEvents(res.data ?? []);
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível carregar o calendário.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [range, ministryId, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  /** Grade do mês começando no domingo, com os dias vizinhos preenchidos. */
  const weeks = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - first.getDay());

    const byDay = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const key = iso(new Date(event.starts_at));
      byDay.set(key, [...(byDay.get(key) ?? []), event]);
    }

    const result: { date: Date; inMonth: boolean; events: CalendarEvent[] }[][] = [];
    const walker = new Date(gridStart);

    for (let week = 0; week < 6; week++) {
      const row = [];
      for (let day = 0; day < 7; day++) {
        row.push({
          date: new Date(walker),
          inMonth: walker.getMonth() === cursor.getMonth(),
          events: byDay.get(iso(walker)) ?? [],
        });
        walker.setDate(walker.getDate() + 1);
      }
      result.push(row);
      if (walker.getMonth() !== cursor.getMonth() && week >= 4) break;
    }

    return result;
  }, [cursor, events]);

  const todayIso = iso(new Date());

  return (
    <main className="p-6 pb-5 flex-1 flex flex-col">
      <div className="bg-white rounded-2xl flex-1 border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
        <PageHeader
          icon={CalendarDays}
          title={t("Calendar")}
          subtitle="Cultos, ensaios e eventos que recebem escala."
          actions={
            <Link
              href="/events/new"
              className="flex items-center justify-center gap-1.5 px-4 h-9 bg-[#6D28D9] text-white text-[13px] font-semibold rounded-lg hover:bg-[#5B21B6] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" strokeWidth={2.4} />
              Novo evento
            </Link>
          }
        />

        <div className="p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className="w-9 h-9 rounded-lg border border-[#E5E7EB] flex items-center justify-center hover:bg-[#F9FAFB] transition-colors"
              aria-label={t("Previous month")}
            >
              <ChevronLeft className="w-4 h-4 text-[#4B5563]" />
            </button>
            <span className="text-[14px] font-bold text-[#1A1A2E] min-w-[150px] text-center">
              {MONTH_LABEL.format(cursor).replace(/^./, (c) => c.toUpperCase())} {cursor.getFullYear()}
            </span>
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              className="w-9 h-9 rounded-lg border border-[#E5E7EB] flex items-center justify-center hover:bg-[#F9FAFB] transition-colors"
              aria-label={t("Next month")}
            >
              <ChevronRight className="w-4 h-4 text-[#4B5563]" />
            </button>
            <button
              onClick={() => {
                const now = new Date();
                setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
              }}
              className="px-3 h-9 rounded-lg border border-[#E5E7EB] text-[12px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB] transition-colors"
            >
              Hoje
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="w-full sm:w-[180px]">
              <CustomSelect
                value={ministryId}
                onChange={(value: string) => setMinistryId(value)}
                placeholder={t("All ministries")}
                searchable
                isClearable
                className="h-9"
                options={ministries.map((m) => ({ value: m.id, label: m.name }))}
              />
            </div>
            <div className="w-full sm:w-[150px]">
              <CustomSelect
                value={typeFilter}
                onChange={(value: string) => setTypeFilter(value)}
                placeholder="Todos os tipos"
                isClearable
                className="h-9"
                options={Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </div>
            <div className="flex rounded-lg border border-[#E5E7EB] overflow-hidden h-9">
              <button
                onClick={() => setView("month")}
                className={`px-3 flex items-center gap-1.5 text-[12px] font-semibold transition-colors ${
                  view === "month" ? "bg-[#6D28D9] text-white" : "bg-white text-[#4B5563] hover:bg-[#F9FAFB]"
                }`}
                aria-pressed={view === "month"}
              >
                <Grid3x3 className="w-3.5 h-3.5" /> Mês
              </button>
              <button
                onClick={() => setView("list")}
                className={`px-3 flex items-center gap-1.5 text-[12px] font-semibold border-l border-[#E5E7EB] transition-colors ${
                  view === "list" ? "bg-[#6D28D9] text-white" : "bg-white text-[#4B5563] hover:bg-[#F9FAFB]"
                }`}
                aria-pressed={view === "list"}
              >
                <List className="w-3.5 h-3.5" /> Lista
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-[#6B7280]">{t("Loading...")}</div>
        ) : view === "month" ? (
          <div className="px-6 pb-6 overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-7 border-t border-l border-[#F1F1F4] rounded-t-lg overflow-hidden">
                {WEEKDAY_INITIALS.map((initial, index) => (
                  <div key={index} className="h-9 flex items-center justify-center border-r border-b border-[#F1F1F4] bg-[#FCFCFD] text-xs font-bold text-[#6B7280]">
                    {initial}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 border-l border-[#F1F1F4]">
                {weeks.flat().map((cell, index) => {
                  const cellIso = iso(cell.date);
                  const isToday = cellIso === todayIso;

                  return (
                    <div
                      key={index}
                      className={`min-h-[104px] border-r border-b border-[#F1F1F4] p-1.5 flex flex-col gap-1 ${
                        cell.inMonth ? "bg-white" : "bg-[#FCFCFD]"
                      }`}
                    >
                      <span
                        className={`text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full ${
                          isToday
                            ? "bg-[#6D28D9] text-white"
                            : cell.inMonth
                              ? "text-[#4B5563]"
                              : "text-[#D1D5DB]"
                        }`}
                      >
                        {cell.date.getDate()}
                      </span>

                      {cell.events.slice(0, 3).map((event) => (
                        <Link
                          key={event.id}
                          href={`/events/${event.id}`}
                          className="rounded-md px-1.5 py-1 text-[10.5px] leading-tight font-semibold truncate transition-opacity hover:opacity-80"
                          style={{
                            backgroundColor: `${TYPE_TINT[event.type] ?? "#6B7280"}14`,
                            color: TYPE_TINT[event.type] ?? "#6B7280",
                            textDecoration: event.status === "cancelled" ? "line-through" : undefined,
                          }}
                          title={`${formatTime(event.starts_at)} ${event.title}`}
                        >
                          {formatTime(event.starts_at)} {event.title}
                        </Link>
                      ))}

                      {cell.events.length > 3 && (
                        <span className="text-[10px] text-[#9CA3AF] px-1.5">+{cell.events.length - 3} mais</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={t("No event this month")}
            description={t("Register services and rehearsals to build the schedules.")}
            action={
              <Link href="/events/new" className="inline-flex items-center justify-center px-4 h-9 bg-[#6D28D9] text-white text-[13px] font-semibold rounded-lg hover:bg-[#5B21B6] transition-colors">
                Novo evento
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-[#F1F1F4] border-t border-[#F1F1F4]">
            {events.map((event) => (
              <li key={event.id}>
                <Link href={`/events/${event.id}`} className="px-6 py-3 flex items-center gap-3 hover:bg-[#FAFAFC] transition-colors">
                  <span className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: TYPE_TINT[event.type] ?? "#6B7280" }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-[13px] font-semibold text-[#1A1A2E] truncate ${event.status === "cancelled" ? "line-through" : ""}`}>
                        {event.title}
                      </p>
                      <StatusBadge status={event.status} />
                      <StatusBadge label={EVENT_TYPE_LABELS[event.type] ?? event.type} tone="neutral" />
                    </div>
                    <p className="text-[11px] text-[#6B7280] mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>{formatEventStamp(event.starts_at)}</span>
                      {event.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {event.location}
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
