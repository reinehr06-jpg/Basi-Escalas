"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { UserCheck, Save, MapPin } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
import ResponsiveTableCard from "@/components/ResponsiveTableCard";
import PageHeader from "@/components/escalas/PageHeader";
import VolunteerAvatar from "@/components/escalas/VolunteerAvatar";
import StatusBadge from "@/components/escalas/StatusBadge";
import EmptyState from "@/components/escalas/EmptyState";
import { usePersistedState } from "@/hooks/usePersistedState";
import { AssignmentsService } from "@/services/assignments.service";
import { EventsService } from "@/services/events.service";
import type { AssignmentRow, AttendanceStatus, CalendarEvent } from "@/types/escalas";
import { formatEventStamp } from "@/lib/escalas-format";

const OPTIONS: { value: AttendanceStatus; label: string; tone: string; active: string }[] = [
  { value: "present", label: "Present", tone: "text-[#047857]", active: "bg-[#10B981] text-white border-[#10B981]" },
  { value: "late", label: "Late", tone: "text-[#B45309]", active: "bg-[#F59E0B] text-white border-[#F59E0B]" },
  { value: "absent", label: "Absent", tone: "text-[#B91C1C]", active: "bg-[#EF4444] text-white border-[#EF4444]" },
  { value: "justified", label: "Justified", tone: "text-[#0369A1]", active: "bg-[#0EA5E9] text-white border-[#0EA5E9]" },
];

/** Módulo 10 — check-in do dia: escolhe o evento e marca a lista inteira. */
export default function AttendancePage() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventId, setEventId] = usePersistedState("attendance:event", "");
  const [rows, setRows] = useState<AssignmentRow[]>([]);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Janela de duas semanas para trás e uma para frente: é onde o check-in acontece.
    const from = new Date();
    from.setDate(from.getDate() - 14);
    const to = new Date();
    to.setDate(to.getDate() + 7);
    const iso = (d: Date) => d.toISOString().slice(0, 10);

    EventsService.range(iso(from), iso(to))
      .then((res) => setEvents((res.data ?? []).filter((e) => e.status !== "cancelled")))
      .catch(() => setEvents([]));
  }, []);

  const load = useCallback(async () => {
    if (!eventId) {
      setRows([]);
      return;
    }
    try {
      setLoading(true);
      const res = await AssignmentsService.list({ event_id: eventId, itemsPerPage: 200 });
      const list = res.data ?? [];
      setRows(list);
      setMarks(Object.fromEntries(list.map((r) => [r.id, r.attendance_status])));
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível carregar a lista.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const changed = rows.filter((row) => marks[row.id] !== row.attendance_status);

  const save = async () => {
    if (changed.length === 0) return;
    setSaving(true);
    try {
      const res = await AssignmentsService.bulkCheckin(
        changed.map((row) => ({ assignment_id: row.id, attendance_status: marks[row.id] })),
      );
      toast.success(res.message);
      load();
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível salvar as presenças.");
    } finally {
      setSaving(false);
    }
  };

  const selected = events.find((e) => e.id === eventId);

  return (
    <main className="p-6 pb-5 flex-1 flex flex-col">
      <div className="bg-white rounded-2xl flex-1 border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
        <PageHeader
          icon={UserCheck}
          title={t("Attendance and check-in")}
          subtitle={t("Mark who showed up. The history feeds the indicators.")}
          actions={
            changed.length > 0 ? (
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[#6D28D9] text-white text-[13px] font-semibold hover:bg-[#5B21B6] disabled:opacity-50 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" strokeWidth={2.2} />
                {saving ? t("Saving...") : `Salvar ${changed.length} alteração(ões)`}
              </button>
            ) : undefined
          }
        />

        <div className="p-6">
          <div className="max-w-md">
            <label className="text-[13px] font-[600] text-[#4B5563] block mb-[6px]">{t("Event")}</label>
            <CustomSelect
              value={eventId}
              onChange={(value: string) => setEventId(value)}
              placeholder="Escolha o evento"
              searchable
              className="h-[42px]"
              options={events.map((e) => ({
                value: e.id,
                label: `${e.title} — ${formatEventStamp(e.starts_at)}`,
              }))}
            />
          </div>

          {selected && (
            <p className="text-[12px] text-[#6B7280] mt-3 flex items-center gap-3 flex-wrap">
              <span>{formatEventStamp(selected.starts_at)}</span>
              {selected.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {selected.location}
                </span>
              )}
            </p>
          )}
        </div>

        {!eventId ? (
          <EmptyState icon={UserCheck} title={t("Choose an event")} description={t("The list of scheduled people shows up here.")} />
        ) : loading ? (
          <div className="p-8 text-center text-sm text-[#6B7280]">{t("Loading...")}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={UserCheck} title={t("Nobody scheduled for this event")} />
        ) : (
          <ResponsiveTableCard minWidth="980px">
            <div className="grid grid-cols-[1.4fr_1.2fr_1.2fr_120px_340px] min-w-[980px] items-center px-6 h-10 border-t border-b border-[#F1F1F4] bg-[#FCFCFD]">
              <span className="text-xs font-bold text-[#6B7280]">{t("Volunteer")}</span>
              <span className="text-xs font-bold text-[#6B7280]">{t("Ministry")}</span>
              <span className="text-xs font-bold text-[#6B7280]">{t("Function")}</span>
              <span className="text-xs font-bold text-[#6B7280]">{t("Confirmation")}</span>
              <span className="text-xs font-bold text-[#6B7280] text-center">{t("Attendance")}</span>
            </div>

            {rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1.4fr_1.2fr_1.2fr_120px_340px] min-w-[980px] items-center px-6 h-[42px] bg-white border-b border-[#F1F1F4] hover:bg-[#FAFAFC] transition-colors last:border-b-0"
              >
                <div className="flex items-center gap-2 min-w-0 pr-4">
                  <VolunteerAvatar name={row.volunteer_name ?? "?"} photoUrl={row.volunteer_photo_url} size={22} />
                  <Link href={`/volunteers/${row.volunteer_id}`} className="text-xs font-[600] text-[#6D28D9] truncate cursor-pointer hover:underline">
                    {row.volunteer_name ?? "-"}
                  </Link>
                </div>

                <span className="text-xs font-[500] text-[#4B5563] truncate pr-4">{row.ministry_name ?? "-"}</span>
                <span className="text-xs font-[500] text-[#4B5563] truncate pr-4">{row.function_name ?? "-"}</span>

                <div><StatusBadge status={row.status} /></div>

                <div className="flex items-center justify-center gap-1.5">
                  {OPTIONS.map((option) => {
                    const active = marks[row.id] === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setMarks((prev) => ({ ...prev, [row.id]: option.value }))}
                        aria-pressed={active}
                        className={`h-7 px-2.5 rounded-lg border text-[11px] font-semibold transition-colors ${
                          active ? option.active : `bg-white border-[#E5E7EB] ${option.tone} hover:bg-[#F9FAFB]`
                        }`}
                      >
                        {t(option.label)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </ResponsiveTableCard>
        )}
      </div>
    </main>
  );
}
