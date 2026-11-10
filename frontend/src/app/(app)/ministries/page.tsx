"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Layers, Plus, Search, Pencil, Trash2, X, Users } from "lucide-react";
import Pagination from "@/components/Pagination";
import ResponsiveTableCard from "@/components/ResponsiveTableCard";
import DeleteModal from "@/components/modals/DeleteModal";
import PageHeader from "@/components/escalas/PageHeader";
import StatusBadge from "@/components/escalas/StatusBadge";
import EmptyState from "@/components/escalas/EmptyState";
import { usePersistedState } from "@/hooks/usePersistedState";
import { MinistriesService } from "@/services/ministries.service";
import type { Ministry } from "@/types/escalas";

export default function MinistriesPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Ministry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = usePersistedState("ministries:q", "");
  const [currentPage, setCurrentPage] = usePersistedState("ministries:page", 1);
  const [pageSize, setPageSize] = usePersistedState("ministries:size", 10);

  const [toDelete, setToDelete] = useState<Ministry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await MinistriesService.list({
        page: currentPage,
        itemsPerPage: pageSize,
        q: searchTerm,
      });
      setItems(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || t("Could not load the ministries."));
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

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const res = await MinistriesService.remove(toDelete.id);
      toast.success(res.message);
      setToDelete(null);
      fetchItems();
    } catch (err) {
      toast.error((err as Error).message || t("Could not delete the ministry."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <main className="p-6 pb-5 flex-1 flex flex-col">
        <div className="bg-white rounded-2xl flex-1 border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
          <PageHeader
            icon={Layers}
            title={t("Ministries")}
            subtitle={t("The teams that receive schedules. Each one has its own functions and rules.")}
          />

          <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Link
              href="/ministries/new"
              className="flex items-center justify-center gap-1.5 px-4 h-9 bg-[#6D28D9] text-white text-[13px] font-semibold rounded-lg hover:bg-[#5B21B6] transition-colors shadow-sm w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" strokeWidth={2.4} />
              {t("New ministry")}
            </Link>

            <div className="relative flex items-center w-full sm:w-[260px] h-9 bg-white border border-[#E5E7EB] rounded-lg px-3 focus-within:border-[#6D28D9] transition-colors">
              <Search className="text-[#9CA3AF] w-4 h-4 mr-2 shrink-0" strokeWidth={2.4} />
              <input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={t("Search by name")}
                aria-label={t("Search ministry")}
                className="bg-transparent border-none outline-none text-[13px] text-[#1A1A2E] placeholder-[#9CA3AF] w-full pr-6"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 p-0.5 rounded-full text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#F3F4F6] transition-colors"
                  aria-label={t("Clear search")}
                >
                  <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>

          <ResponsiveTableCard minWidth="700px">
            <div className="grid grid-cols-[110px_1.4fr_2fr_90px_110px] min-w-[700px] items-center px-6 h-10 border-t border-b border-[#F1F1F4] bg-[#FCFCFD]">
              <span className="text-xs font-bold text-[#6B7280]">{t("Status")}</span>
              <span className="text-xs font-bold text-[#6B7280]">{t("Ministry")}</span>
              <span className="text-xs font-bold text-[#6B7280]">{t("Description")}</span>
              <span className="text-xs font-bold text-[#6B7280] text-center">{t("Leaders")}</span>
              <span className="text-xs font-bold text-[#6B7280] text-center">{t("Actions")}</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-[#6B7280]">{t("Loading...")}</div>
            ) : items.length === 0 ? (
              <EmptyState
                icon={Layers}
                title={t("No ministry found")}
                description={searchTerm ? t("Try another search term.") : t("Register the first ministry to start building schedules.")}
              />
            ) : (
              items.map((ministry) => (
                <div
                  key={ministry.id}
                  className="grid grid-cols-[110px_1.4fr_2fr_90px_110px] min-w-[700px] items-center px-6 h-[42px] bg-white border-b border-[#F1F1F4] hover:bg-[#FAFAFC] transition-colors last:border-b-0"
                >
                  <div>
                    <StatusBadge status={ministry.status} />
                  </div>

                  <div className="flex items-center gap-2 min-w-0 pr-4">
                    <span className="w-1.5 h-4 rounded-full shrink-0" style={{ backgroundColor: ministry.color ?? "#6D28D9" }} />
                    <Link href={`/ministries/${ministry.id}`} className="text-xs font-[600] text-[#6D28D9] truncate cursor-pointer hover:underline">
                      {ministry.name}
                    </Link>
                  </div>

                  <span className="text-xs font-[500] text-[#4B5563] truncate pr-4">{ministry.description || "-"}</span>

                  <div className="flex items-center justify-center gap-1 text-xs font-[500] text-[#4B5563]">
                    <Users className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    {ministry.leader_ids?.length ?? 0}
                  </div>

                  <div className="flex items-center justify-center gap-1.5">
                    <Link
                      href={`/ministries/${ministry.id}/edit`}
                      className="w-8 h-8 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-center hover:bg-[#F3F4F6] transition-colors"
                      aria-label={`${t("Edit")} ${ministry.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#6B7280]" strokeWidth={2.2} />
                    </Link>
                    <button
                      onClick={() => setToDelete(ministry)}
                      className="w-8 h-8 rounded-lg bg-[#EF4444]/10 flex items-center justify-center hover:bg-[#EF4444]/20 transition-colors border border-transparent"
                      aria-label={`${t("Delete")} ${ministry.name}`}
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

      <DeleteModal
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        itemName={toDelete?.name}
        isLoading={deleting}
        description={t("Deleting the ministry also removes its functions. Past schedules stay in the history.")}
      />
    </>
  );
}
