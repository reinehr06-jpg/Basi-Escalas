"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Repeat2, Check, X, UserPlus } from "lucide-react";
import Pagination from "@/components/Pagination";
import CustomSelect from "@/components/CustomSelect";
import PageHeader from "@/components/escalas/PageHeader";
import StatusBadge from "@/components/escalas/StatusBadge";
import EmptyState from "@/components/escalas/EmptyState";
import Modal from "@/components/Modal";
import VolunteerAvatar from "@/components/escalas/VolunteerAvatar";
import { usePersistedState } from "@/hooks/usePersistedState";
import { SwapsService } from "@/services/swaps.service";
import type { Candidate, SwapRow } from "@/types/escalas";
import { formatEventStamp, relativeDays } from "@/lib/escalas-format";

/** Módulo 09 — fila de trocas: quem pediu, quem aceitou, quem aprova. */
export default function SwapsPage() {
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
            title="Trocas e substituições"
            subtitle="Pedidos dos voluntários. A aprovação da liderança efetiva a troca na escala."
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
            <div className="p-8 text-center text-sm text-[#6B7280]">Carregando…</div>
          ) : items.length === 0 ? (
            <EmptyState icon={Repeat2} title="Nenhum pedido de troca" description="Os pedidos abertos pelos voluntários aparecem aqui." />
          ) : (
            <ul className="divide-y divide-[#F1F1F4] border-t border-[#F1F1F4]">
              {items.map((swap) => {
                const pending = swap.status === "open" || swap.status === "accepted";

                return (
                  <li key={swap.id} className="px-6 py-4 flex flex-col lg:flex-row lg:items-center gap-3">
                    <span
                      className="w-1.5 h-10 rounded-full shrink-0 hidden lg:block"
                      style={{ backgroundColor: swap.ministry_color ?? "#6D28D9" }}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[13px] font-semibold text-[#1A1A2E]">
                          {swap.requester_name ?? "—"}
                        </p>
                        <StatusBadge status={swap.status} />
                        <StatusBadge
                          label={swap.type === "swap" ? "Troca" : "Substituição"}
                          tone="neutral"
                        />
                      </div>
                      <p className="text-[12px] text-[#4B5563] mt-0.5">{swap.reason}</p>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">
                        {swap.ministry_name} · {swap.event_title} · {formatEventStamp(swap.event_starts_at)}
                        {relativeDays(swap.event_starts_at) ? ` (${relativeDays(swap.event_starts_at)})` : ""}
                      </p>
                      {swap.accepted_name && (
                        <p className="text-[11px] text-[#047857] mt-1 font-semibold">
                          {swap.accepted_name} se ofereceu para cobrir.
                        </p>
                      )}
                    </div>

                    {pending && (
                      <div className="flex items-center gap-2 shrink-0">
                        {swap.status === "accepted" ? (
                          <button
                            onClick={() => approveWith(swap.id)}
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-[#10B981] text-white text-[12px] font-semibold hover:bg-[#059669] disabled:opacity-50 transition-colors"
                          >
                            <Check className="w-4 h-4" strokeWidth={2.4} />
                            Aprovar troca
                          </button>
                        ) : (
                          <button
                            onClick={() => openCandidates(swap)}
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-[#6D28D9] text-white text-[12px] font-semibold hover:bg-[#5B21B6] disabled:opacity-50 transition-colors"
                          >
                            <UserPlus className="w-4 h-4" strokeWidth={2.2} />
                            Escolher quem cobre
                          </button>
                        )}
                        <button
                          onClick={() => reject(swap.id)}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-[#E5E7EB] text-[12px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB] disabled:opacity-50 transition-colors"
                        >
                          <X className="w-4 h-4" strokeWidth={2.2} />
                          Recusar
                        </button>
                      </div>
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

      <Modal open={Boolean(picking)} onClose={() => setPicking(null)} maxWidth="520px">
        <div className="flex flex-col max-h-[85vh]">
          <header className="px-5 pt-5 pb-3 border-b border-[#F1F1F4]">
            <h2 className="text-[16px] font-bold text-[#1A1A2E]">Quem vai cobrir a vaga</h2>
            <p className="text-[12px] text-[#6B7280] mt-0.5">
              Aprovar já efetiva a substituição na escala.
            </p>
          </header>

          <div className="overflow-y-auto">
            {loadingCandidates ? (
              <p className="p-8 text-center text-sm text-[#6B7280]">Carregando…</p>
            ) : candidates.filter((c) => c.eligible).length === 0 ? (
              <p className="p-8 text-center text-sm text-[#6B7280]">
                Ninguém disponível nesta data para esta função.
              </p>
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
                      >
                        Aprovar
                      </button>
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
