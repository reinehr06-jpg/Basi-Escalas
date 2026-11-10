"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ClipboardList, Search, X, CalendarDays } from "lucide-react";
import Pagination from "@/components/Pagination";
import ResponsiveTableCard from "@/components/ResponsiveTableCard";
import CustomSelect from "@/components/CustomSelect";
import PageHeader from "@/components/escalas/PageHeader";
import StatusBadge from "@/components/escalas/StatusBadge";
import EmptyState from "@/components/escalas/EmptyState";
import { usePersistedState } from "@/hooks/usePersistedState";
import { SchedulesService } from "@/services/schedules.service";
import { MinistriesService } from "@/services/ministries.service";
import { EventsService } from "@/services/events.service";
import type { CalendarEvent, Ministry, Schedule } from "@/types/escalas";
import { formatEventStamp } from "@/lib/escalas-format";

export default function SchedulesPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Schedule[]>([]);
  const [events, setEvents] = useState<Record<string, CalendarEvent>>({});
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = usePersistedState("schedules:q", "");
  const [ministryId, setMinistryId] = usePersistedState("schedules:ministry", "");
  const [status, setStatus] = usePersistedState("schedules:status", "");
  const [currentPage, setCurrentPage] = usePersistedState("schedules:page", 1);
  const [pageSize, setPageSize] = usePersistedState("schedules:size", 10);

  const ministryById = useMemo(
    () => Object.fromEntries(ministries.map((m) => [m.id, m])),
    [ministries],
  );

  useEffect(() => {
    MinistriesService.list({ itemsPerPage: 200 })
      .then((res) => setMinistries(res.data ?? []))
      .catch(() => setMinistries([]));
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await SchedulesService.list({
        page: currentPage,
        itemsPerPage: pageSize,
        q: searchTerm,
        ministry_id: ministryId || undefined,
        status: status || undefined,
      });
      const list = res.data ?? [];
      setItems(list);
      setTotal(res.total ?? 0);

      // Resolve os eventos da página para exibir data e título.
      const ids = [...new Set(list.map((s) => s.event_id))];
      const resolved = await Promise.all(
        ids.map((eventId) =>
          EventsService.getById(eventId)
            .then((r) => r.item)
            .catch(() => null),
        ),
      );
      setEvents(
        Object.fromEntries(resolved.filter(Boolean).map((e) => [(e as CalendarEvent).id, e as CalendarEvent])),
      );
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível carregar as escalas.");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, ministryId, status]);

  useEffect(() => {
    const timer = setTimeout(fetchItems, 400);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  return (
    <main className="p-6 pb-5 flex-1 flex flex-col">
      <div className="bg-white rounded-2xl flex-1 border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
        <PageHeader
          icon={ClipboardList}
          title="Escalas"
          subtitle={t("One schedule per ministry on each event. Create it from the calendar.")}
          actions={
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 px-4 h-9 bg-[#6D28D9] text-white text-[13px] font-semibold rounded-lg hover:bg-[#5B21B6] transition-colors shadow-sm"
            >
              <CalendarDays className="w-4 h-4" strokeWidth={2.4} />{t("Go to calendar")}</Link>
          }
        />

        <div className="p-6 flex flex-col sm:flex-row gap-2.5">
          <div className="w-full sm:w-[190px]">
            <CustomSelect
              value={ministryId}
              onChange={(value: string) => {
                setMinistryId(value);
                setCurrentPage(1);
              }}
              placeholder={t("All ministries")}
              searchable
              isClearable
              className="h-9"
              options={ministries.map((m) => ({ value: m.id, label: m.name }))}
            />
          </div>

          <div className="w-full sm:w-[160px]">
            <CustomSelect
              value={status}
              onChange={(value: string) => {
                setStatus(value);
                setCurrentPage(1);
              }}
              placeholder={t("All statuses")}
              isClearable
              className="h-9"
              options={[
                { value: "draft", label: "Rascunho" },
                { value: "published", label: "Publicada" },
                { value: "closed", label: "Encerrada" },
                { value: "cancelled", label: "Cancelada" },
              ]}
            />
          </div>

          <div className="relative flex items-center w-full sm:w-[240px] h-9 bg-white border border-[#E5E7EB] rounded-lg px-3 focus-within:border-[#6D28D9] transition-colors">
            <Search className="text-[#9CA3AF] w-4 h-4 mr-2 shrink-0" strokeWidth={2.4} />
            <input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar escala"
              aria-label="Buscar escala"
              className="bg-transparent border-none outline-none text-[13px] text-[#1A1A2E] placeholder-[#9CA3AF] w-full pr-6"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 p-0.5 rounded-full text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#F3F4F6] transition-colors"
                aria-label="Limpar busca"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        <ResponsiveTableCard minWidth="800px">
          <div className="grid grid-cols-[110px_1.3fr_1.7fr_150px_100px] min-w-[800px] items-center px-6 h-10 border-t border-b border-[#F1F1F4] bg-[#FCFCFD]">
            <span className="text-xs font-bold text-[#6B7280]">{t("Status")}</span>
            <span className="text-xs font-bold text-[#6B7280]">{t("Ministry")}</span>
            <span className="text-xs font-bold text-[#6B7280]">{t("Event")}</span>
            <span className="text-xs font-bold text-[#6B7280]">Data</span>
            <span className="text-xs font-bold text-[#6B7280] text-center">{t("Functions")}</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-[#6B7280]">{t("Loading...")}</div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Nenhuma escala encontrada"
              description={t("Schedules are created from a calendar event.")}
              action={
                <Link href="/events" className="inline-flex items-center justify-center px-4 h-9 bg-[#6D28D9] text-white text-[13px] font-semibold rounded-lg hover:bg-[#5B21B6] transition-colors">{t("Open calendar")}</Link>
              }
            />
          ) : (
            items.map((schedule) => {
              const ministry = ministryById[schedule.ministry_id];
              const event = events[schedule.event_id];

              return (
                <Link
                  key={schedule.id}
                  href={`/schedules/${schedule.id}`}
                  className="grid grid-cols-[110px_1.3fr_1.7fr_150px_100px] min-w-[800px] items-center px-6 h-[42px] bg-white border-b border-[#F1F1F4] hover:bg-[#FAFAFC] transition-colors last:border-b-0"
                >
                  <div>
                    <StatusBadge status={schedule.status} />
                  </div>

                  <div className="flex items-center gap-2 min-w-0 pr-4">
                    <span className="w-1.5 h-4 rounded-full shrink-0" style={{ backgroundColor: ministry?.color ?? "#6D28D9" }} />
                    <span className="text-xs font-[600] text-[#6D28D9] truncate">
                      {ministry?.name ?? schedule.name}
                    </span>
                  </div>

                  <span className="text-xs font-[500] text-[#4B5563] truncate pr-4">{event?.title ?? "-"}</span>
                  <span className="text-xs font-[500] text-[#4B5563] truncate pr-4">
                    {event ? formatEventStamp(event.starts_at) : "-"}
                  </span>
                  <span className="text-xs font-[500] text-[#4B5563] text-center tabular-nums">
                    {schedule.slots?.length ?? 0}
                  </span>
                </Link>
              );
            })
          )}
        </ResponsiveTableCard>

        <Pagination
          total={total}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>
    </main>
  );
}
