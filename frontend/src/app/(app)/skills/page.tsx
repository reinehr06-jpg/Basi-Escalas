"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Award, Plus, Search, Pencil, Trash2, X } from "lucide-react";
import Pagination from "@/components/Pagination";
import ResponsiveTableCard from "@/components/ResponsiveTableCard";
import DeleteModal from "@/components/modals/DeleteModal";
import CustomSelect from "@/components/CustomSelect";
import Modal from "@/components/Modal";
import PageHeader from "@/components/escalas/PageHeader";
import StatusBadge from "@/components/escalas/StatusBadge";
import EmptyState from "@/components/escalas/EmptyState";
import { usePersistedState } from "@/hooks/usePersistedState";
import { SkillsService } from "@/services/skills.service";
import { MinistriesService } from "@/services/ministries.service";
import type { Ministry, Skill } from "@/types/escalas";

const EMPTY = { name: "", description: "", category: "", ministry_id: "", validity_months: "" };

/** Módulo 13 — habilidades usadas como requisito das funções. */
export default function SkillsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Skill[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [searchTerm, setSearchTerm] = usePersistedState("skills:q", "");
  const [currentPage, setCurrentPage] = usePersistedState("skills:page", 1);
  const [pageSize, setPageSize] = usePersistedState("skills:size", 10);

  const [editing, setEditing] = useState<Skill | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [toDelete, setToDelete] = useState<Skill | null>(null);

  useEffect(() => {
    MinistriesService.list({ itemsPerPage: 200 })
      .then((res) => setMinistries(res.data ?? []))
      .catch(() => setMinistries([]));
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await SkillsService.list({ page: currentPage, itemsPerPage: pageSize, q: searchTerm });
      setItems(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível carregar as habilidades.");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(fetchItems, 400);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  const openNew = () => {
    setForm(EMPTY);
    setEditing(null);
    setCreating(true);
  };

  const openEdit = (skill: Skill) => {
    setForm({
      name: skill.name,
      description: skill.description ?? "",
      category: skill.category ?? "",
      ministry_id: skill.ministry_id ?? "",
      validity_months: skill.validity_months ? String(skill.validity_months) : "",
    });
    setEditing(skill);
    setCreating(true);
  };

  const save = async () => {
    setBusy(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category.trim() || null,
      ministry_id: form.ministry_id || null,
      validity_months: form.validity_months ? Number(form.validity_months) : null,
    };
    try {
      const res = editing
        ? await SkillsService.update(editing.id, payload)
        : await SkillsService.create(payload);
      toast.success(res.message);
      setCreating(false);
      fetchItems();
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      const res = await SkillsService.remove(toDelete.id);
      toast.success(res.message);
      setToDelete(null);
      fetchItems();
    } catch (err) {
      toast.error((err as Error).message || t("Could not delete."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <main className="p-6 pb-5 flex-1 flex flex-col">
        <div className="bg-white rounded-2xl flex-1 border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
          <PageHeader
            icon={Award}
            title={t("Skills")}
            subtitle={t("What a function requires and what each volunteer masters.")}
          />

          <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <button
              onClick={openNew}
              className="flex items-center justify-center gap-1.5 px-4 h-9 bg-[#6D28D9] text-white text-[13px] font-semibold rounded-lg hover:bg-[#5B21B6] transition-colors shadow-sm w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" strokeWidth={2.4} />
              Nova habilidade
            </button>

            <div className="relative flex items-center w-full sm:w-[240px] h-9 bg-white border border-[#E5E7EB] rounded-lg px-3 focus-within:border-[#6D28D9] transition-colors">
              <Search className="text-[#9CA3AF] w-4 h-4 mr-2 shrink-0" strokeWidth={2.4} />
              <input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar habilidade"
                aria-label="Buscar habilidade"
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

          <ResponsiveTableCard minWidth="760px">
            <div className="grid grid-cols-[1.3fr_1.7fr_150px_130px_110px] min-w-[760px] items-center px-6 h-10 border-t border-b border-[#F1F1F4] bg-[#FCFCFD]">
              <span className="text-xs font-bold text-[#6B7280]">Habilidade</span>
              <span className="text-xs font-bold text-[#6B7280]">{t("Description")}</span>
              <span className="text-xs font-bold text-[#6B7280]">Categoria</span>
              <span className="text-xs font-bold text-[#6B7280] text-center">Validade</span>
              <span className="text-xs font-bold text-[#6B7280] text-center">{t("Actions")}</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-[#6B7280]">{t("Loading...")}</div>
            ) : items.length === 0 ? (
              <EmptyState icon={Award} title="Nenhuma habilidade cadastrada" description={t("Use skills to warn when someone does not meet a function requirement.")} />
            ) : (
              items.map((skill) => (
                <div
                  key={skill.id}
                  className="grid grid-cols-[1.3fr_1.7fr_150px_130px_110px] min-w-[760px] items-center px-6 h-[42px] bg-white border-b border-[#F1F1F4] hover:bg-[#FAFAFC] transition-colors last:border-b-0"
                >
                  <button onClick={() => openEdit(skill)} className="text-xs font-[600] text-[#6D28D9] truncate text-left pr-4 cursor-pointer hover:underline">
                    {skill.name}
                  </button>

                  <span className="text-xs font-[500] text-[#4B5563] truncate pr-4">{skill.description || "-"}</span>
                  <span className="text-xs font-[500] text-[#4B5563] truncate pr-4">{skill.category || "-"}</span>

                  <div className="flex justify-center">
                    {skill.validity_months ? (
                      <StatusBadge label={`${skill.validity_months} meses`} tone="info" />
                    ) : (
                      <span className="text-[12px] text-[#9CA3AF]">Sem validade</span>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => openEdit(skill)}
                      className="w-8 h-8 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-center hover:bg-[#F3F4F6] transition-colors"
                      aria-label={`Editar ${skill.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#6B7280]" strokeWidth={2.2} />
                    </button>
                    <button
                      onClick={() => setToDelete(skill)}
                      className="w-8 h-8 rounded-lg bg-[#EF4444]/10 flex items-center justify-center hover:bg-[#EF4444]/20 transition-colors"
                      aria-label={`Excluir ${skill.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
              ))
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

      <Modal open={creating} onClose={() => setCreating(false)} maxWidth="500px">
        <div className="p-6 flex flex-col gap-4">
          <h2 className="text-[16px] font-bold text-[#1A1A2E]">
            {editing ? "Editar habilidade" : "Nova habilidade"}
          </h2>

          <div className="flex flex-col gap-[6px]">
            <label htmlFor="skill-name" className="text-[13px] font-[600] text-[#4B5563]">
              Nome <span className="text-[#EF4444] ml-0.5">*</span>
            </label>
            <input
              id="skill-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-[42px] px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label htmlFor="skill-desc" className="text-[13px] font-[600] text-[#4B5563]">{t("Description")}</label>
            <textarea
              id="skill-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="px-3 py-2.5 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9] resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="skill-cat" className="text-[13px] font-[600] text-[#4B5563]">Categoria</label>
              <input
                id="skill-cat"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder={t("technical, vocal…")}
                className="h-[42px] px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
              />
            </div>
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="skill-validity" className="text-[13px] font-[600] text-[#4B5563]">Validade (meses)</label>
              <input
                id="skill-validity"
                type="number"
                min={1}
                value={form.validity_months}
                onChange={(e) => setForm({ ...form, validity_months: e.target.value })}
                placeholder="Sem validade"
                className="h-[42px] px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-[6px]">
            <label className="text-[13px] font-[600] text-[#4B5563]">{t("Ministry (optional)")}</label>
            <CustomSelect
              value={form.ministry_id}
              onChange={(value: string) => setForm({ ...form, ministry_id: value })}
              placeholder={t("Applies to all")}
              searchable
              isClearable
              className="h-[42px]"
              options={ministries.map((m) => ({ value: m.id, label: m.name }))}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setCreating(false)} className="px-4 h-9 rounded-lg border border-[#E5E7EB] text-[13px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB] transition-colors">{t("Cancel")}</button>
            <button
              onClick={save}
              disabled={!form.name.trim() || busy}
              className="px-4 h-9 rounded-lg bg-[#6D28D9] text-white text-[13px] font-semibold hover:bg-[#5B21B6] disabled:opacity-50 transition-colors"
            >
              {busy ? t("Saving...") : t("Save")}
            </button>
          </div>
        </div>
      </Modal>

      <DeleteModal
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        itemName={toDelete?.name}
        isLoading={busy}
        description={t("Skills required by a function cannot be deleted.")}
      />
    </>
  );
}
