"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Repeat2, Check, X, UserPlus } from "lucide-react";
import Pagination from "@/components/Pagination";
import CustomSelect from "@/components/CustomSelect";
import ResponsiveTableCard from "@/components/ResponsiveTableCard";
import PageHeader from "@/components/escalas/PageHeader";
import StatusBadge from "@/components/escalas/StatusBadge";
import EmptyState from "@/components/escalas/EmptyState";
import Modal from "@/components/Modal";
import VolunteerAvatar from "@/components/escalas/VolunteerAvatar";
import { usePersistedState } from "@/hooks/usePersistedState";
import { SwapsService } from "@/services/swaps.service";
import type { Candidate, SwapRow } from "@/types/escalas";
import { formatEventStamp } from "@/lib/escalas-format";

/** Módulo 09 — fila de trocas: quem pediu, quem aceitou, quem aprova. */
export default function SwapsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<SwapRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [status, setStatus] = usePersistedState("swaps:status", "");
  const [currentPage, setCurrentPage] = usePersistedState("swaps:page", 1);
  const [pageSize, setPageSize] = usePersistedState("swaps:size", 10);

  const [picking, setPicking] = useState<SwapRow | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await SwapsService.list({
        page: currentPage,
        itemsPerPage: pageSize,
        status: status || undefined,
      });
      setItems(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível carregar as trocas.");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, status]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openCandidates = async (swap: SwapRow) => {
    setPicking(swap);
    setLoadingCandidates(true);
    try {
      const res = await SwapsService.candidates(swap.id);
      setCandidates(res.data ?? []);
    } catch {
      setCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const approveWith = async (swapId: string, volunteerId?: string) => {
    setBusy(true);
    try {
      const res = await SwapsService.review(swapId, "approved", { volunteer_id: volunteerId });
      toast.success(res.message);
      setPicking(null);
      fetchItems();
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível aprovar a troca.");
    } finally {
      setBusy(false);
    }
  };

  const reject = async (swapId: string) => {
    setBusy(true);
    try {
      const res = await SwapsService.review(swapId, "rejected");
      toast.success(res.message);
      fetchItems();
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível recusar o pedido.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <main className="p-6 pb-5 flex-1 flex flex-col">
        <div className="bg-white rounded-2xl flex-1 border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
          <PageHeader
            icon={Repeat2}
            title={t("Swaps and replacements")}
            subtitle={t("Volunteer requests. Leadership approval applies the swap to the schedule.")}
          />

          <div className="p-6">
            <div className="w-full sm:w-[200px]">
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
                  { value: "open", label: "Abertas" },
                  { value: "accepted", label: "Com oferta" },
                  { value: "approved", label: "Aprovadas" },
                  { value: "rejected", label: "Recusadas" },
                  { value: "cancelled", label: "Canceladas" },
                ]}
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-[#6B7280]">{t("Loading...")}</div>
          ) : items.length === 0 ? (
            <EmptyState icon={Repeat2} title={t("No swap request")} description={t("Requests opened by volunteers show up here.")} />
          ) : (
            <ResponsiveTableCard minWidth="1060px">
              <div className="grid grid-cols-[110px_1.3fr_110px_1.1fr_1.4fr_150px_1.4fr_230px] min-w-[1060px] items-center px-6 h-10 border-t border-b border-[#F1F1F4] bg-[#FCFCFD]">
                <span className="text-xs font-bold text-[#6B7280]">{t("Status")}</span>
                <span className="text-xs font-bold text-[#6B7280]">{t("Requester")}</span>
                <span className="text-xs font-bold text-[#6B7280]">{t("Type")}</span>
                <span className="text-xs font-bold text-[#6B7280]">{t("Ministry")}</span>
                <span className="text-xs font-bold text-[#6B7280]">{t("Event")}</span>
                <span className="text-xs font-bold text-[#6B7280]">{t("Date")}</span>
                <span className="text-xs font-bold text-[#6B7280]">{t("Reason")}</span>
                <span className="text-xs font-bold text-[#6B7280] text-center">{t("Actions")}</span>
              </div>

              {items.map((swap) => {
                const pending = swap.status === "open" || swap.status === "accepted";

                return (
                  <div
                    key={swap.id}
                    className="grid grid-cols-[110px_1.3fr_110px_1.1fr_1.4fr_150px_1.4fr_230px] min-w-[1060px] items-center px-6 h-[42px] bg-white border-b border-[#F1F1F4] hover:bg-[#FAFAFC] transition-colors last:border-b-0"
                  >
                    <div><StatusBadge status={swap.status} /></div>

                    <span className="text-xs font-[600] text-[#1A1A2E] truncate pr-4" title={swap.accepted_name ? `${t("Covered by")}: ${swap.accepted_name}` : undefined}>
                      {swap.requester_name ?? "-"}
                    </span>

                    <span className="text-xs font-[500] text-[#4B5563] truncate pr-4">
                      {swap.type === "swap" ? t("Swap") : t("Replacement")}
                    </span>

                    <div className="flex items-center gap-1.5 min-w-0 pr-4">
                      <span className="w-1.5 h-4 rounded-full shrink-0" style={{ backgroundColor: swap.ministry_color ?? "#6D28D9" }} />
                      <span className="text-xs font-[500] text-[#4B5563] truncate">{swap.ministry_name ?? "-"}</span>
                    </div>

                    <span className="text-xs font-[500] text-[#4B5563] truncate pr-4">{swap.event_title ?? "-"}</span>
                    <span className="text-xs font-[500] text-[#4B5563] truncate pr-4">{formatEventStamp(swap.event_starts_at)}</span>
                    <span className="text-xs font-[500] text-[#4B5563] truncate pr-4" title={swap.reason}>{swap.reason}</span>

                    <div className="flex items-center justify-center gap-1.5">
                      {pending ? (
                        <>
                          {swap.status === "accepted" ? (
                            <button
                              onClick={() => approveWith(swap.id)}
                              disabled={busy}
                              className="inline-flex items-center gap-1 px-2.5 h-7 rounded-lg bg-[#10B981]/10 text-[#047857] text-[11px] font-semibold hover:bg-[#10B981]/20 disabled:opacity-50 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" strokeWidth={2.4} />
                              {t("Approve")}
                            </button>
                          ) : (
                            <button
                              onClick={() => openCandidates(swap)}
                              disabled={busy}
                              className="inline-flex items-center gap-1 px-2.5 h-7 rounded-lg bg-[#F4EEFF] text-[#6D28D9] text-[11px] font-semibold hover:bg-[#EAE0FF] disabled:opacity-50 transition-colors"
                            >
                              <UserPlus className="w-3.5 h-3.5" strokeWidth={2.2} />
                              {t("Pick cover")}
                            </button>
                          )}
                          <button
                            onClick={() => reject(swap.id)}
                            disabled={busy}
                            className="inline-flex items-center gap-1 px-2.5 h-7 rounded-lg bg-[#EF4444]/10 text-[#B91C1C] text-[11px] font-semibold hover:bg-[#EF4444]/20 disabled:opacity-50 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" strokeWidth={2.2} />
                            {t("Reject")}
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-[#9CA3AF]">{swap.accepted_name ?? "-"}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </ResponsiveTableCard>
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

      <Modal open={Boolean(picking)} onClose={() => setPicking(null)} maxWidth="520px">
        <div className="flex flex-col max-h-[85vh]">
          <header className="px-5 pt-5 pb-3 border-b border-[#F1F1F4]">
            <h2 className="text-[16px] font-bold text-[#1A1A2E]">Quem vai cobrir a vaga</h2>
            <p className="text-[12px] text-[#6B7280] mt-0.5">{t("Approving applies the replacement to the schedule right away.")}</p>
          </header>

          <div className="overflow-y-auto">
            {loadingCandidates ? (
              <p className="p-8 text-center text-sm text-[#6B7280]">{t("Loading...")}</p>
            ) : candidates.filter((c) => c.eligible).length === 0 ? (
              <p className="p-8 text-center text-sm text-[#6B7280]">{t("Nobody available on this date for this function.")}</p>
            ) : (
              <ul className="divide-y divide-[#F1F1F4]">
                {candidates
                  .filter((c) => c.eligible)
                  .map((candidate) => (
                    <li key={candidate.volunteer.id} className="px-5 py-3 flex items-center gap-3">
                      <VolunteerAvatar name={candidate.volunteer.name} photoUrl={candidate.volunteer.photo_url} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-[#1A1A2E] truncate">{candidate.volunteer.name}</p>
                        <p className="text-[11px] text-[#6B7280]">
                          {candidate.load_month} escala(s) no mês
                          {candidate.warnings.length > 0 ? ` · ${candidate.warnings[0].message}` : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => picking && approveWith(picking.id, candidate.volunteer.id)}
                        disabled={busy}
                        className="px-3 h-8 rounded-lg bg-[#6D28D9] text-white text-[12px] font-semibold hover:bg-[#5B21B6] disabled:opacity-50 transition-colors shrink-0"
                      >{t("Approve")}</button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
