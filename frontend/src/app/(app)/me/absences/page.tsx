"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarOff, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/escalas/PageHeader";
import StatusBadge from "@/components/escalas/StatusBadge";
import EmptyState from "@/components/escalas/EmptyState";
import BackButton from "@/components/BackButton";
import CustomSelect from "@/components/CustomSelect";
import Modal from "@/components/Modal";
import { AbsencesService } from "@/services/availability.service";
import { MeService } from "@/services/escalas-dashboard.service";
import type { AbsenceRow } from "@/types/escalas";
import { ABSENCE_TYPE_LABELS, formatDate, relativeDays } from "@/lib/escalas-format";

export default function MyAbsencesPage() {
  const [volunteerId, setVolunteerId] = useState<string | null>(null);
  const [items, setItems] = useState<AbsenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ starts_at: "", ends_at: "", reason: "", type: "personal" });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const me = await MeService.dashboard();
      setVolunteerId(me.volunteer?.id ?? null);

      if (me.volunteer?.id) {
        const res = await AbsencesService.list({ mine: true, itemsPerPage: 50 });
        setItems(res.data ?? []);
      }
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível carregar suas ausências.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!volunteerId) return;
    setBusy(true);
    try {
      const res = await AbsencesService.create({ ...form, volunteer_id: volunteerId });
      toast.success(res.message);
      setCreating(false);
      setForm({ starts_at: "", ends_at: "", reason: "", type: "personal" });
      load();
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível registrar.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      const res = await AbsencesService.remove(id);
      toast.success(res.message);
      load();
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível remover.");
    } finally {
      setBusy(false);
    }
  };

  const valid = form.starts_at && form.ends_at && form.reason.trim();

  return (
    <>
      <main className="p-6 pb-5 flex-1 flex flex-col">
        <div className="bg-white rounded-2xl flex-1 border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 pt-5">
            <BackButton href="/me" />
          </div>

          <PageHeader
            icon={CalendarOff}
            title="Minhas ausências"
            subtitle="Avise com antecedência os períodos em que não poderá servir."
            actions={
              volunteerId ? (
                <button
                  onClick={() => setCreating(true)}
                  className="inline-flex items-center gap-1.5 px-4 h-9 bg-[#6D28D9] text-white text-[13px] font-semibold rounded-lg hover:bg-[#5B21B6] transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.4} />
                  Avisar ausência
                </button>
              ) : undefined
            }
          />

          <div className="h-6" />

          {loading ? (
            <div className="p-8 text-center text-sm text-[#6B7280]">Carregando…</div>
          ) : !volunteerId ? (
            <EmptyState icon={CalendarOff} title="Usuário sem cadastro de voluntário vinculado" />
          ) : items.length === 0 ? (
            <EmptyState icon={CalendarOff} title="Nenhuma ausência registrada" />
          ) : (
            <ul className="divide-y divide-[#F1F1F4] border-t border-[#F1F1F4]">
              {items.map((absence) => (
                <li key={absence.id} className="px-6 py-3.5 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-semibold text-[#1A1A2E]">
                        {formatDate(absence.starts_at)} – {formatDate(absence.ends_at)}
                      </p>
                      <StatusBadge status={absence.status} />
                      <StatusBadge label={ABSENCE_TYPE_LABELS[absence.type] ?? absence.type} tone="neutral" />
                    </div>
                    <p className="text-[12px] text-[#4B5563] mt-0.5">{absence.reason}</p>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">{relativeDays(absence.starts_at)}</p>
                  </div>

                  {absence.status === "pending" && (
                    <button
                      onClick={() => remove(absence.id)}
                      disabled={busy}
                      className="w-8 h-8 rounded-lg bg-[#EF4444]/10 flex items-center justify-center hover:bg-[#EF4444]/20 disabled:opacity-50 transition-colors shrink-0"
                      aria-label="Remover ausência"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" strokeWidth={2.2} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <Modal open={creating} onClose={() => setCreating(false)} maxWidth="480px">
        <div className="p-6 flex flex-col gap-4">
          <h2 className="text-[16px] font-bold text-[#1A1A2E]">Avisar ausência</h2>
          <p className="text-[13px] text-[#4B5563]">
            A liderança revisa o pedido. Depois de aprovado, você deixa de aparecer como candidato nessas datas.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="ma-start" className="text-[13px] font-[600] text-[#4B5563]">
                De <span className="text-[#EF4444] ml-0.5">*</span>
              </label>
              <input
                id="ma-start"
                type="date"
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                className="h-[42px] px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
              />
            </div>
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="ma-end" className="text-[13px] font-[600] text-[#4B5563]">
                Até <span className="text-[#EF4444] ml-0.5">*</span>
              </label>
              <input
                id="ma-end"
                type="date"
                min={form.starts_at || undefined}
                value={form.ends_at}
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
            <label htmlFor="ma-reason" className="text-[13px] font-[600] text-[#4B5563]">
              Motivo <span className="text-[#EF4444] ml-0.5">*</span>
            </label>
            <textarea
              id="ma-reason"
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
              disabled={!valid || busy}
              className="px-4 h-9 rounded-lg bg-[#6D28D9] text-white text-[13px] font-semibold hover:bg-[#5B21B6] disabled:opacity-50 transition-colors"
            >
              {busy ? "Enviando…" : "Enviar"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
