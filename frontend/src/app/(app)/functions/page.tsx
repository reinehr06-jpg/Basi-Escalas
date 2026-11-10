"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ClipboardList, Plus, Search, Pencil, Trash2, X } from "lucide-react";
import Pagination from "@/components/Pagination";
import ResponsiveTableCard from "@/components/ResponsiveTableCard";
import DeleteModal from "@/components/modals/DeleteModal";
import CustomSelect from "@/components/CustomSelect";
import PageHeader from "@/components/escalas/PageHeader";
import StatusBadge from "@/components/escalas/StatusBadge";
import EmptyState from "@/components/escalas/EmptyState";
import { usePersistedState } from "@/hooks/usePersistedState";
import { FunctionsService } from "@/services/functions.service";
import { MinistriesService } from "@/services/ministries.service";
import type { Ministry, MinistryFunction } from "@/types/escalas";

export default function FunctionsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<MinistryFunction[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = usePersistedState("functions:q", "");
  const [ministryId, setMinistryId] = usePersistedState("functions:ministry", "");
  const [currentPage, setCurrentPage] = usePersistedState("functions:page", 1);
  const [pageSize, setPageSize] = usePersistedState("functions:size", 10);

  const [toDelete, setToDelete] = useState<MinistryFunction | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      const res = await FunctionsService.list({
        page: currentPage,
        itemsPerPage: pageSize,
        q: searchTerm,
        ministry_id: ministryId || undefined,
      });
      setItems(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível carregar as funções.");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, ministryId]);

  useEffect(() => {
    const timer = setTimeout(fetchItems, 400);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const res = await FunctionsService.remove(toDelete.id);
      toast.success(res.message);
      setToDelete(null);
      fetchItems();
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível excluir a função.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <main className="p-6 pb-5 flex-1 flex flex-col">
        <div className="bg-white rounded-2xl flex-1 border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
          <PageHeader
            icon={ClipboardList}
            title={t("Functions")}
            subtitle={t("What each person does inside the ministry. The schedule slots come from here.")}
          />

          <div className="p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <Link
              href="/functions/new"
              className="flex items-center justify-center gap-1.5 px-4 h-9 bg-[#6D28D9] text-white text-[13px] font-semibold rounded-lg hover:bg-[#5B21B6] transition-colors shadow-sm w-full lg:w-auto"
            >
              <Plus className="w-4 h-4" strokeWidth={2.4} />{t("New function")}</Link>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto">
              <div className="w-full sm:w-[200px]">
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

              <div className="relative flex items-center w-full sm:w-[240px] h-9 bg-white border border-[#E5E7EB] rounded-lg px-3 focus-within:border-[#6D28D9] transition-colors">
                <Search className="text-[#9CA3AF] w-4 h-4 mr-2 shrink-0" strokeWidth={2.4} />
                <input
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={t("Search function")}
                  aria-label={t("Search function")}
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
          </div>

          <ResponsiveTableCard minWidth="760px">
            <div className="grid grid-cols-[100px_1.6fr_1.4fr_110px_110px] min-w-[760px] items-center px-6 h-10 border-t border-b border-[#F1F1F4] bg-[#FCFCFD]">
              <span className="text-xs font-bold text-[#6B7280]">{t("Status")}</span>
              <span className="text-xs font-bold text-[#6B7280]">{t("Function")}</span>
              <span className="text-xs font-bold text-[#6B7280]">{t("Ministry")}</span>
              <span className="text-xs font-bold text-[#6B7280] text-center">Por escala</span>
              <span className="text-xs font-bold text-[#6B7280] text-center">{t("Actions")}</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-[#6B7280]">{t("Loading...")}</div>
            ) : items.length === 0 ? (
              <EmptyState icon={ClipboardList} title={t("No function found")} description={t("Register the ministry functions so schedules can be built.")} />
            ) : (
              items.map((fn) => {
                const ministry = ministryById[fn.ministry_id];
                return (
                  <div
                    key={fn.id}
                    className="grid grid-cols-[100px_1.6fr_1.4fr_110px_110px] min-w-[760px] items-center px-6 h-[42px] bg-white border-b border-[#F1F1F4] hover:bg-[#FAFAFC] transition-colors last:border-b-0"
                  >
                    <div>
                      <StatusBadge status={fn.status} />
                    </div>

                    <div className="min-w-0 flex items-center gap-2 pr-4">
                      <Link href={`/functions/${fn.id}/edit`} className="text-xs font-[600] text-[#6D28D9] truncate cursor-pointer hover:underline">
                        {fn.name}
                      </Link>
                      {fn.is_leadership && <StatusBadge label={t("Leadership")} tone="purple" />}
                    </div>

                    <div className="min-w-0 flex items-center gap-1.5 pr-4">
                      <span className="w-1.5 h-4 rounded-full shrink-0" style={{ backgroundColor: ministry?.color ?? "#D1D5DB" }} />
                      <Link href={`/ministries/${fn.ministry_id}`} className="text-xs font-[500] text-[#4B5563] truncate hover:underline">
                        {ministry?.name ?? "-"}
                      </Link>
                    </div>

                    <span className="text-xs font-[500] text-[#4B5563] text-center tabular-nums">{fn.default_quantity}</span>

                    <div className="flex items-center justify-center gap-1.5">
                      <Link
                        href={`/functions/${fn.id}/edit`}
                        className="w-8 h-8 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-center hover:bg-[#F3F4F6] transition-colors"
                        aria-label={`Editar ${fn.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#6B7280]" strokeWidth={2.2} />
                      </Link>
                      <button
                        onClick={() => setToDelete(fn)}
                        className="w-8 h-8 rounded-lg bg-[#EF4444]/10 flex items-center justify-center hover:bg-[#EF4444]/20 transition-colors border border-transparent"
                        aria-label={`Excluir ${fn.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" strokeWidth={2.2} />
                      </button>
                    </div>
                  </div>
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

      <DeleteModal
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        itemName={toDelete?.name}
        isLoading={deleting}
        description={t("Functions with open assignments cannot be deleted.")}
      />
    </>
  );
}
