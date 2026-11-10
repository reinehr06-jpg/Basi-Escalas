"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CheckCheck, CheckCircle2, XCircle } from "lucide-react";
import Pagination from "@/components/Pagination";
import ResponsiveTableCard from "@/components/ResponsiveTableCard";
import CustomSelect from "@/components/CustomSelect";
import PageHeader from "@/components/escalas/PageHeader";
import StatusBadge from "@/components/escalas/StatusBadge";
import VolunteerAvatar from "@/components/escalas/VolunteerAvatar";
import EmptyState from "@/components/escalas/EmptyState";
import Modal from "@/components/Modal";
import { usePersistedState } from "@/hooks/usePersistedState";
import { AssignmentsService } from "@/services/assignments.service";
import { MinistriesService } from "@/services/ministries.service";
import type { AssignmentRow, Ministry } from "@/types/escalas";
import { formatEventStamp } from "@/lib/escalas-format";

/** Módulo 08 — quem ainda não respondeu, e resposta no lugar do voluntário. */
export default function ConfirmationsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<AssignmentRow[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [status, setStatus] = usePersistedState("confirmations:status", "pending");
  const [ministryId, setMinistryId] = usePersistedState("confirmations:ministry", "");
  const [currentPage, setCurrentPage] = usePersistedState("confirmations:page", 1);
  const [pageSize, setPageSize] = usePersistedState("confirmations:size", 15);

  const [declining, setDeclining] = useState<AssignmentRow | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    MinistriesService.list({ itemsPerPage: 200 })
      .then((res) => setMinistries(res.data ?? []))
      .catch(() => setMinistries([]));
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await AssignmentsService.list({
        page: currentPage,
        itemsPerPage: pageSize,
        status: status || undefined,
        ministry_id: ministryId || undefined,
        upcoming: true,
      });
      setItems(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível carregar as confirmações.");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, status, ministryId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const confirm = async (row: AssignmentRow) => {
    setBusy(true);
    try {
      const res = await AssignmentsService.confirm(row.id);
      toast.success(`${row.volunteer_name}: ${res.message.toLowerCase()}`);
      fetchItems();
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível confirmar.");
    } finally {
      setBusy(false);
    }
  };

  const decline = async () => {
    if (!declining || !reason.trim()) return;
    setBusy(true);
    try {
      const res = await AssignmentsService.decline(declining.id, reason.trim());
      toast.success(res.message);
      setDeclining(null);
      setReason("");
      fetchItems();
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível registrar a recusa.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <main className="p-6 pb-5 flex-1 flex flex-col">
        <div className="bg-white rounded-2xl flex-1 border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
          <PageHeader
            icon={CheckCheck}
            title={t("Confirmations")}
            subtitle={t("Upcoming assignments waiting for the volunteer's answer.")}
          />

          <div className="p-6 flex flex-col sm:flex-row gap-2.5">
            <div className="w-full sm:w-[180px]">
              <CustomSelect
                value={status}
                onChange={(value: string) => {
                  setStatus(value);
                  setCurrentPage(1);
                }}
                placeholder="Todas as respostas"
                isClearable
                className="h-9"
                options={[
                  { value: "pending", label: "Aguardando" },
                  { value: "confirmed", label: "Confirmados" },
                  { value: "declined", label: "Recusados" },
                ]}
              />
            </div>
            <div className="w-full sm:w-[190px]">
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
          </div>

          <ResponsiveTableCard minWidth="960px">
            <div className="grid grid-cols-[1.4fr_1.5fr_150px_1.2fr_1.2fr_190px] min-w-[960px] items-center px-6 h-10 border-t border-b border-[#F1F1F4] bg-[#FCFCFD]">
              <span className="text-xs font-bold text-[#6B7280]">{t("Volunteer")}</span>
              <span className="text-xs font-bold text-[#6B7280]">{t("Event")}</span>
              <span className="text-xs font-bold text-[#6B7280]">Data</span>
              <span className="text-xs font-bold text-[#6B7280]">{t("Ministry")}</span>
              <span className="text-xs font-bold text-[#6B7280]">{t("Function")}</span>
              <span className="text-xs font-bold text-[#6B7280] text-center">Resposta</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-[#6B7280]">{t("Loading...")}</div>
            ) : items.length === 0 ? (
              <EmptyState
                icon={CheckCheck}
                title={status === "pending" ? t("Nobody pending") : "Nenhum registro"}
                description={status === "pending" ? t("Every upcoming assignment has been answered.") : undefined}
              />
            ) : (
              items.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[1.4fr_1.5fr_150px_1.2fr_1.2fr_190px] min-w-[960px] items-center px-6 h-[42px] bg-white border-b border-[#F1F1F4] hover:bg-[#FAFAFC] transition-colors last:border-b-0"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-4">
                    <VolunteerAvatar name={row.volunteer_name ?? "?"} photoUrl={row.volunteer_photo_url} size={22} />
                    <Link href={`/volunteers/${row.volunteer_id}`} className="text-xs font-[600] text-[#6D28D9] truncate cursor-pointer hover:underline">
                      {row.volunteer_name ?? "-"}
                    </Link>
                  </div>

                  <span className="text-xs font-[500] text-[#4B5563] truncate pr-4">{row.event_title ?? "-"}</span>
                  <span className="text-xs font-[500] text-[#4B5563] truncate pr-4">{formatEventStamp(row.event_starts_at)}</span>
                  <span className="text-xs font-[500] text-[#4B5563] truncate pr-4">{row.ministry_name ?? "-"}</span>
                  <span className="text-xs font-[500] text-[#4B5563] truncate pr-4">{row.function_name ?? "-"}</span>

                  <div className="flex items-center justify-center gap-1.5">
                    {row.status === "pending" ? (
                      <>
                        <button
                          onClick={() => confirm(row)}
                          disabled={busy}
                          className="inline-flex items-center gap-1 px-2.5 h-8 rounded-lg bg-[#10B981]/10 text-[#047857] text-[12px] font-semibold hover:bg-[#10B981]/20 disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.4} />{t("Confirm")}</button>
                        <button
                          onClick={() => setDeclining(row)}
                          disabled={busy}
                          className="inline-flex items-center gap-1 px-2.5 h-8 rounded-lg bg-[#EF4444]/10 text-[#B91C1C] text-[12px] font-semibold hover:bg-[#EF4444]/20 disabled:opacity-50 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" strokeWidth={2.4} />{t("Reject")}</button>
                      </>
                    ) : (
                      <StatusBadge status={row.status} />
                    )}
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

      <Modal open={Boolean(declining)} onClose={() => setDeclining(null)}>
        <div className="p-6 flex flex-col gap-4">
          <h2 className="text-[16px] font-bold text-[#1A1A2E]">Registrar recusa</h2>
          <p className="text-[13px] text-[#4B5563]">
            {declining?.volunteer_name} sai da escala de <strong>{declining?.event_title}</strong> e a vaga volta a ficar em aberto.
          </p>
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="conf-reason" className="text-[13px] font-[600] text-[#4B5563]">{t("Reason")}<span className="text-[#EF4444] ml-0.5">*</span>
            </label>
            <textarea
              id="conf-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="px-3 py-2.5 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9] resize-y"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeclining(null)} className="px-4 h-9 rounded-lg border border-[#E5E7EB] text-[13px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB] transition-colors">{t("Back")}</button>
            <button
              onClick={decline}
              disabled={!reason.trim() || busy}
              className="px-4 h-9 rounded-lg bg-[#EF4444] text-white text-[13px] font-semibold hover:bg-[#DC2626] disabled:opacity-50 transition-colors"
            >
              Registrar recusa
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
