"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { UserCheck, Save, MapPin } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
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
  { value: "present", label: "Presente", tone: "text-[#047857]", active: "bg-[#10B981] text-white border-[#10B981]" },
  { value: "late", label: "Atrasado", tone: "text-[#B45309]", active: "bg-[#F59E0B] text-white border-[#F59E0B]" },
  { value: "absent", label: "Faltou", tone: "text-[#B91C1C]", active: "bg-[#EF4444] text-white border-[#EF4444]" },
  { value: "justified", label: "Justificado", tone: "text-[#0369A1]", active: "bg-[#0EA5E9] text-white border-[#0EA5E9]" },
];

/** Módulo 10 — check-in do dia: escolhe o evento e marca a lista inteira. */
export default function AttendancePage() {
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
          title="Presenças e check-in"
          subtitle="Marque quem apareceu no dia. O histórico alimenta os indicadores."
          actions={
            changed.length > 0 ? (
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[#6D28D9] text-white text-[13px] font-semibold hover:bg-[#5B21B6] disabled:opacity-50 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" strokeWidth={2.2} />
                {saving ? "Salvando…" : `Salvar ${changed.length} alteração(ões)`}
              </button>
            ) : undefined
          }
        />

        <div className="p-6">
          <div className="max-w-md">
            <label className="text-[13px] font-[600] text-[#4B5563] block mb-[6px]">Evento</label>
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
          <EmptyState icon={UserCheck} title="Escolha um evento" description="A lista de quem está escalado aparece aqui." />
        ) : loading ? (
          <div className="p-8 text-center text-sm text-[#6B7280]">Carregando…</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={UserCheck} title="Ninguém escalado neste evento" />
        ) : (
          <ul className="divide-y divide-[#F1F1F4] border-t border-[#F1F1F4]">
            {rows.map((row) => (
              <li key={row.id} className="px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <VolunteerAvatar name={row.volunteer_name ?? "?"} photoUrl={row.volunteer_photo_url} />
                  <div className="min-w-0">
                    <Link href={`/volunteers/${row.volunteer_id}`} className="text-[13px] font-[600] text-[#1A1A2E] hover:text-[#6D28D9] hover:underline block truncate">
                      {row.volunteer_name ?? "—"}
                    </Link>
                    <p className="text-[11px] text-[#6B7280] truncate">
                      {row.ministry_name} · {row.function_name}
                    </p>
                  </div>
                  <StatusBadge status={row.status} />
                </div>

                <div className="flex flex-wrap gap-1.5 shrink-0">
                  {OPTIONS.map((option) => {
                    const active = marks[row.id] === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setMarks((prev) => ({ ...prev, [row.id]: option.value }))}
                        aria-pressed={active}
                        className={`h-8 px-2.5 rounded-lg border text-[12px] font-semibold transition-colors ${
                          active ? option.active : `bg-white border-[#E5E7EB] ${option.tone} hover:bg-[#F9FAFB]`
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
