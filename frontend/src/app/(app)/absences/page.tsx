"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CalendarOff, Plus, Check, X } from "lucide-react";
import Pagination from "@/components/Pagination";
import CustomSelect from "@/components/CustomSelect";
import PageHeader from "@/components/escalas/PageHeader";
import StatusBadge from "@/components/escalas/StatusBadge";
import VolunteerAvatar from "@/components/escalas/VolunteerAvatar";
import EmptyState from "@/components/escalas/EmptyState";
import Modal from "@/components/Modal";
import { usePersistedState } from "@/hooks/usePersistedState";
import { AbsencesService } from "@/services/availability.service";
import { VolunteersService } from "@/services/volunteers.service";
import type { AbsenceRow, Volunteer } from "@/types/escalas";
import { ABSENCE_TYPE_LABELS, formatDate, relativeDays } from "@/lib/escalas-format";

/** Módulo 07 — ausências: registrar e revisar. Aprovar libera as vagas do período. */
export default function AbsencesPage() {
  const [items, setItems] = useState<AbsenceRow[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [status, setStatus] = usePersistedState("absences:status", "");
  const [currentPage, setCurrentPage] = usePersistedState("absences:page", 1);
  const [pageSize, setPageSize] = usePersistedState("absences:size", 10);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ volunteer_id: "", starts_at: "", ends_at: "", reason: "", type: "personal" });

  useEffect(() => {
    VolunteersService.list({ itemsPerPage: 300 })
      .then((res) => setVolunteers(res.data ?? []))
      .catch(() => setVolunteers([]));
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await AbsencesService.list({
        page: currentPage,
        itemsPerPage: pageSize,
        status: status || undefined,
      });
      setItems(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível carregar as ausências.");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, status]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const review = async (id: string, decision: "approved" | "rejected") => {
    setBusy(true);
    try {
      const res = await AbsencesService.review(id, decision);
      toast.success(res.message);
      fetchItems();
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível revisar.");
    } finally {
      setBusy(false);
    }
  };

  const create = async () => {
    setBusy(true);
    try {
      const res = await AbsencesService.create(form);
      toast.success(res.message);
      setCreating(false);
      setForm({ volunteer_id: "", starts_at: "", ends_at: "", reason: "", type: "personal" });
      fetchItems();
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível registrar a ausência.");
    } finally {
      setBusy(false);
    }
  };

  const formValid = form.volunteer_id && form.starts_at && form.ends_at && form.reason.trim();

  return (
    <>
      <main className="p-6 pb-5 flex-1 flex flex-col">
        <div className="bg-white rounded-2xl flex-1 border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
          <PageHeader
            icon={CalendarOff}
            title="Ausências"
            subtitle="Períodos em que o voluntário não pode servir. Aprovar libera as vagas automaticamente."
            actions={
              <button
                onClick={() => setCreating(true)}
                className="inline-flex items-center gap-1.5 px-4 h-9 bg-[#6D28D9] text-white text-[13px] font-semibold rounded-lg hover:bg-[#5B21B6] transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" strokeWidth={2.4} />
                Registrar ausência
              </button>
            }
          />

          <div className="p-6">
            <div className="w-full sm:w-[200px]">
              <CustomSelect
                value={status}
                onChange={(value: string) => {
                  setStatus(value);
                  setCurrentPage(1);
                }}
                placeholder="Todas as situações"
                isClearable
                className="h-9"
                options={[
                  { value: "pending", label: "A revisar" },
                  { value: "approved", label: "Aprovadas" },
                  { value: "rejected", label: "Recusadas" },
                ]}
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-[#6B7280]">Carregando…</div>
          ) : items.length === 0 ? (
            <EmptyState icon={CalendarOff} title="Nenhuma ausência registrada" />
          ) : (
            <ul className="divide-y divide-[#F1F1F4] border-t border-[#F1F1F4]">
              {items.map((absence) => (
                <li key={absence.id} className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <VolunteerAvatar name={absence.volunteer_name ?? "?"} photoUrl={absence.volunteer_photo_url} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/volunteers/${absence.volunteer_id}`} className="text-[13px] font-[600] text-[#1A1A2E] hover:text-[#6D28D9] hover:underline">
                          {absence.volunteer_name ?? "—"}
                        </Link>
                        <StatusBadge status={absence.status} />
                        <StatusBadge label={ABSENCE_TYPE_LABELS[absence.type] ?? absence.type} tone="neutral" />
                      </div>
                      <p className="text-[12px] text-[#4B5563] mt-0.5 truncate">{absence.reason}</p>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">
                        {formatDate(absence.starts_at)} – {formatDate(absence.ends_at)}
                        {relativeDays(absence.starts_at) ? ` · começa ${relativeDays(absence.starts_at)}` : ""}
                      </p>
                    </div>
                  </div>

                  {absence.status === "pending" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => review(absence.id, "approved")}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-[#10B981]/10 text-[#047857] text-[12px] font-semibold hover:bg-[#10B981]/20 disabled:opacity-50 transition-colors"
                      >
                        <Check className="w-4 h-4" strokeWidth={2.4} />
                        Aprovar
                      </button>
                      <button
                        onClick={() => review(absence.id, "rejected")}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-[#E5E7EB] text-[12px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB] disabled:opacity-50 transition-colors"
                      >
                        <X className="w-4 h-4" strokeWidth={2.2} />
                        Recusar
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

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

      <Modal open={creating} onClose={() => setCreating(false)} maxWidth="520px">
        <div className="p-6 flex flex-col gap-4">
          <h2 className="text-[16px] font-bold text-[#1A1A2E]">Registrar ausência</h2>

          <div className="flex flex-col gap-[6px]">
            <label className="text-[13px] font-[600] text-[#4B5563]">
              Voluntário <span className="text-[#EF4444] ml-0.5">*</span>
            </label>
            <CustomSelect
              value={form.volunteer_id}
              onChange={(value: string) => setForm({ ...form, volunteer_id: value })}
              placeholder="Selecione"
              searchable
              className="h-[42px]"
              options={volunteers.map((v) => ({ value: v.id, label: v.name }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="abs-start" className="text-[13px] font-[600] text-[#4B5563]">
                De <span className="text-[#EF4444] ml-0.5">*</span>
              </label>
              <input
                id="abs-start"
                type="date"
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                className="h-[42px] px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
              />
            </div>
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="abs-end" className="text-[13px] font-[600] text-[#4B5563]">
                Até <span className="text-[#EF4444] ml-0.5">*</span>
              </label>
              <input
                id="abs-end"
                type="date"
                value={form.ends_at}
                min={form.starts_at || undefined}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                className="h-[42px] px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-[6px]">
            <label className="text-[13px] font-[600] text-[#4B5563]">Tipo</label>
            <CustomSelect
              value={form.type}
              onChange={(value: string) => setForm({ ...form, type: value })}
              className="h-[42px]"
              options={Object.entries(ABSENCE_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label htmlFor="abs-reason" className="text-[13px] font-[600] text-[#4B5563]">
              Motivo <span className="text-[#EF4444] ml-0.5">*</span>
            </label>
            <textarea
              id="abs-reason"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={3}
              className="px-3 py-2.5 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9] resize-y"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setCreating(false)} className="px-4 h-9 rounded-lg border border-[#E5E7EB] text-[13px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB] transition-colors">
              Cancelar
            </button>
            <button
              onClick={create}
              disabled={!formValid || busy}
              className="px-4 h-9 rounded-lg bg-[#6D28D9] text-white text-[13px] font-semibold hover:bg-[#5B21B6] disabled:opacity-50 transition-colors"
            >
              {busy ? "Salvando…" : "Registrar"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
