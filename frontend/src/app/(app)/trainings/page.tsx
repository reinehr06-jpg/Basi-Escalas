"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { GraduationCap, Plus, CheckCheck, Users } from "lucide-react";
import Pagination from "@/components/Pagination";
import CustomSelect from "@/components/CustomSelect";
import Modal from "@/components/Modal";
import PageHeader from "@/components/escalas/PageHeader";
import StatusBadge from "@/components/escalas/StatusBadge";
import EmptyState from "@/components/escalas/EmptyState";
import { usePersistedState } from "@/hooks/usePersistedState";
import { SkillsService, TrainingsService } from "@/services/skills.service";
import { MinistriesService } from "@/services/ministries.service";
import { VolunteersService } from "@/services/volunteers.service";
import type { Ministry, Skill, Training, Volunteer } from "@/types/escalas";
import { formatEventStamp } from "@/lib/escalas-format";

const EMPTY = { name: "", ministry_id: "", skill_ids: [] as string[], starts_at: "", instructor: "", location: "" };

/** Módulo 13 — capacitação. Concluir credita as habilidades nos perfis. */
export default function TrainingsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Training[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [currentPage, setCurrentPage] = usePersistedState("trainings:page", 1);
  const [pageSize, setPageSize] = usePersistedState("trainings:size", 10);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const [completing, setCompleting] = useState<Training | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    MinistriesService.list({ itemsPerPage: 200 }).then((r) => setMinistries(r.data ?? [])).catch(() => setMinistries([]));
    SkillsService.list({ itemsPerPage: 200 }).then((r) => setSkills(r.data ?? [])).catch(() => setSkills([]));
    VolunteersService.list({ itemsPerPage: 300 }).then((r) => setVolunteers(r.data ?? [])).catch(() => setVolunteers([]));
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await TrainingsService.list({ page: currentPage, itemsPerPage: pageSize });
      setItems(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível carregar as capacitações.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const create = async () => {
    setBusy(true);
    try {
      const res = await TrainingsService.create({
        name: form.name.trim(),
        ministry_id: form.ministry_id || null,
        skill_ids: form.skill_ids,
        starts_at: form.starts_at,
        instructor: form.instructor.trim() || null,
        location: form.location.trim() || null,
      });
      toast.success(res.message);
      setCreating(false);
      setForm(EMPTY);
      fetchItems();
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível criar a capacitação.");
    } finally {
      setBusy(false);
    }
  };

  const complete = async () => {
    if (!completing) return;
    setBusy(true);
    try {
      const res = await TrainingsService.complete(
        completing.id,
        completed.map((volunteer_id) => ({ volunteer_id, status: "completed" as const })),
      );
      toast.success(res.message);
      setCompleting(null);
      setCompleted([]);
      fetchItems();
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível concluir.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <main className="p-6 pb-5 flex-1 flex flex-col">
        <div className="bg-white rounded-2xl flex-1 border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
          <PageHeader
            icon={GraduationCap}
            title={t("Training")}
            subtitle={t("Training that credits skills to the profile of who takes part.")}
            actions={
              <button
                onClick={() => setCreating(true)}
                className="inline-flex items-center gap-1.5 px-4 h-9 bg-[#6D28D9] text-white text-[13px] font-semibold rounded-lg hover:bg-[#5B21B6] transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" strokeWidth={2.4} />{t("New training")}</button>
            }
          />

          <div className="h-6" />

          {loading ? (
            <div className="p-8 text-center text-sm text-[#6B7280]">{t("Loading...")}</div>
          ) : items.length === 0 ? (
            <EmptyState icon={GraduationCap} title={t("No training registered")} description={t("Train the team and register it here to keep skills up to date.")} />
          ) : (
            <ul className="divide-y divide-[#F1F1F4] border-t border-[#F1F1F4]">
              {items.map((training) => {
                const ministry = ministries.find((m) => m.id === training.ministry_id);
                const linked = (training.skill_ids ?? [])
                  .map((sid) => skills.find((s) => s.id === sid)?.name)
                  .filter(Boolean);

                return (
                  <li key={training.id} className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[13px] font-semibold text-[#1A1A2E]">{training.name}</p>
                        <StatusBadge
                          status={training.status === "completed" ? "approved" : "open"}
                          label={training.status === "completed" ? t("Completed") : t("Scheduled")}
                          tone={training.status === "completed" ? "success" : "warning"}
                        />
                      </div>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">
                        {formatEventStamp(training.starts_at)}
                        {ministry ? ` · ${ministry.name}` : ""}
                        {training.instructor ? ` · ${training.instructor}` : ""}
                      </p>
                      {linked.length > 0 && (
                        <p className="text-[11px] text-[#5B21B6] mt-1">Credita: {linked.join(", ")}</p>
                      )}
                      {(training.participants?.length ?? 0) > 0 && (
                        <p className="text-[11px] text-[#6B7280] mt-0.5 flex items-center gap-1">
                          <Users className="w-3 h-3" /> {training.participants?.length} participante(s)
                        </p>
                      )}
                    </div>

                    {training.status !== "completed" && (
                      <button
                        onClick={() => {
                          setCompleting(training);
                          setCompleted([]);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-[#E5E7EB] text-[12px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB] transition-colors shrink-0"
                      >
                        <CheckCheck className="w-4 h-4" strokeWidth={2.2} />{t("Complete")}</button>
                    )}
                  </li>
                );
              })}
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
          <h2 className="text-[16px] font-bold text-[#1A1A2E]">{t("New training")}</h2>

          <div className="flex flex-col gap-[6px]">
            <label htmlFor="t-name" className="text-[13px] font-[600] text-[#4B5563]">
              Nome <span className="text-[#EF4444] ml-0.5">*</span>
            </label>
            <input
              id="t-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-[42px] px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="t-date" className="text-[13px] font-[600] text-[#4B5563]">
                Data <span className="text-[#EF4444] ml-0.5">*</span>
              </label>
              <input
                id="t-date"
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                className="h-[42px] px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
              />
            </div>
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="t-instructor" className="text-[13px] font-[600] text-[#4B5563]">Instrutor</label>
              <input
                id="t-instructor"
                value={form.instructor}
                onChange={(e) => setForm({ ...form, instructor: e.target.value })}
                className="h-[42px] px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-[6px]">
            <label className="text-[13px] font-[600] text-[#4B5563]">{t("Ministry")}</label>
            <CustomSelect
              value={form.ministry_id}
              onChange={(value: string) => setForm({ ...form, ministry_id: value })}
              placeholder="Todos"
              searchable
              isClearable
              className="h-[42px]"
              options={ministries.map((m) => ({ value: m.id, label: m.name }))}
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label className="text-[13px] font-[600] text-[#4B5563]">Habilidades creditadas</label>
            <CustomSelect
              value={form.skill_ids}
              onChange={(value: string[]) => setForm({ ...form, skill_ids: value })}
              placeholder="Selecione"
              multiple
              searchable
              className="h-[42px]"
              options={skills.map((s) => ({ value: s.id, label: s.name }))}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setCreating(false)} className="px-4 h-9 rounded-lg border border-[#E5E7EB] text-[13px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB] transition-colors">{t("Cancel")}</button>
            <button
              onClick={create}
              disabled={!form.name.trim() || !form.starts_at || busy}
              className="px-4 h-9 rounded-lg bg-[#6D28D9] text-white text-[13px] font-semibold hover:bg-[#5B21B6] disabled:opacity-50 transition-colors"
            >
              {busy ? t("Saving...") : t("Create")}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(completing)} onClose={() => setCompleting(null)} maxWidth="520px">
        <div className="p-6 flex flex-col gap-4">
          <h2 className="text-[16px] font-bold text-[#1A1A2E]">{t("Complete training")}</h2>
          <p className="text-[13px] text-[#4B5563]">
            Quem for marcado recebe as habilidades de <strong>{completing?.name}</strong> no perfil,
            passando a contar como apto nas funções que as exigem.
          </p>

          <div className="flex flex-col gap-[6px]">
            <label className="text-[13px] font-[600] text-[#4B5563]">{t("Completed by")}</label>
            <CustomSelect
              value={completed}
              onChange={(value: string[]) => setCompleted(value)}
              placeholder={t("Select the volunteers")}
              multiple
              searchable
              className="h-[42px]"
              options={volunteers.map((v) => ({ value: v.id, label: v.name }))}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setCompleting(null)} className="px-4 h-9 rounded-lg border border-[#E5E7EB] text-[13px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB] transition-colors">{t("Cancel")}</button>
            <button
              onClick={complete}
              disabled={completed.length === 0 || busy}
              className="px-4 h-9 rounded-lg bg-[#6D28D9] text-white text-[13px] font-semibold hover:bg-[#5B21B6] disabled:opacity-50 transition-colors"
            >
              {busy ? t("Saving...") : `Concluir para ${completed.length}`}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
