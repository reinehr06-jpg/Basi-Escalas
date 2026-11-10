"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Search, TriangleAlert, Ban, Check, X } from "lucide-react";
import Modal from "@/components/Modal";
import VolunteerAvatar from "@/components/escalas/VolunteerAvatar";
import { SchedulesService } from "@/services/schedules.service";
import type { Candidate } from "@/types/escalas";
import { relativeDays } from "@/lib/escalas-format";

/**
 * Escolha de voluntário para uma vaga.
 *
 * Mostra impedimento e alerta lado a lado: quem tem impedimento não pode ser
 * escalado; quem tem alerta pode, mas o líder vê o motivo antes de decidir.
 */
export default function CandidatePicker({
  open,
  onClose,
  scheduleId,
  functionId,
  functionName,
  onPick,
  picking,
}: {
  open: boolean;
  onClose: () => void;
  scheduleId: string;
  functionId: string | null;
  functionName: string;
  onPick: (volunteerId: string) => void | Promise<void>;
  picking: boolean;
}) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [term, setTerm] = useState("");
  const [showBlocked, setShowBlocked] = useState(false);

  const load = useCallback(async () => {
    if (!functionId) return;
    try {
      setLoading(true);
      const res = await SchedulesService.candidates(scheduleId, functionId);
      setCandidates(res.data ?? []);
    } catch {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [scheduleId, functionId]);

  useEffect(() => {
    if (open) {
      setTerm("");
      setShowBlocked(false);
      load();
    }
  }, [open, load]);

  const filtered = useMemo(() => {
    const normalized = term.trim().toLowerCase();
    return candidates.filter((candidate) => {
      if (!showBlocked && !candidate.eligible) return false;
      if (!normalized) return true;
      return candidate.volunteer.name.toLowerCase().includes(normalized);
    });
  }, [candidates, term, showBlocked]);

  const blockedCount = candidates.filter((c) => !c.eligible).length;

  return (
    <Modal open={open} onClose={onClose} maxWidth="560px">
      <div className="flex flex-col max-h-[85vh]">
        <header className="px-5 pt-5 pb-3 border-b border-[#F1F1F4]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-bold text-[#1A1A2E]">Escalar em {functionName}</h2>
              <p className="text-[12px] text-[#6B7280] mt-0.5">
                Ordenado por quem está há mais tempo sem servir e tem menos carga no mês.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-[#F3F4F6] flex items-center justify-center shrink-0 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4 text-[#6B7280]" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <div className="relative flex items-center flex-1 h-9 bg-white border border-[#E5E7EB] rounded-lg px-3 focus-within:border-[#6D28D9] transition-colors">
              <Search className="text-[#9CA3AF] w-4 h-4 mr-2 shrink-0" strokeWidth={2.4} />
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Buscar voluntário"
                aria-label="Buscar voluntário"
                className="bg-transparent border-none outline-none text-[13px] text-[#1A1A2E] placeholder-[#9CA3AF] w-full"
              />
            </div>

            {blockedCount > 0 && (
              <button
                onClick={() => setShowBlocked((v) => !v)}
                aria-pressed={showBlocked}
                className={`h-9 px-3 rounded-lg border text-[12px] font-semibold whitespace-nowrap transition-colors ${
                  showBlocked
                    ? "bg-[#1A1A2E] text-white border-[#1A1A2E]"
                    : "bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-[#F9FAFB]"
                }`}
              >
                {showBlocked ? "Ocultar" : "Ver"} impedidos ({blockedCount})
              </button>
            )}
          </div>
        </header>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <p className="p-8 text-center text-sm text-[#6B7280]">Carregando candidatos…</p>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-[#1A1A2E]">Nenhum voluntário disponível</p>
              <p className="text-xs text-[#6B7280] mt-1">
                {candidates.length === 0
                  ? "Ninguém está vinculado a esta função. Ajuste o cadastro dos voluntários."
                  : "Todos os candidatos têm impedimento nesta data."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#F1F1F4]">
              {filtered.map((candidate) => {
                const blocked = !candidate.eligible;

                return (
                  <li key={candidate.volunteer.id} className="px-5 py-3 flex items-start gap-3">
                    <VolunteerAvatar name={candidate.volunteer.name} photoUrl={candidate.volunteer.photo_url} size={34} />

                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-[#1A1A2E] truncate">{candidate.volunteer.name}</p>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">
                        {candidate.load_month} escala(s) no mês
                        {candidate.last_served_at
                          ? ` · serviu ${relativeDays(candidate.last_served_at)}`
                          : " · nunca serviu"}
                      </p>

                      {candidate.blockers.map((flag) => (
                        <p key={flag.code} className="flex items-start gap-1.5 text-[11px] text-[#B91C1C] mt-1">
                          <Ban className="w-3.5 h-3.5 shrink-0 mt-px" />
                          {flag.message}
                        </p>
                      ))}

                      {candidate.warnings.map((flag) => (
                        <p key={flag.code} className="flex items-start gap-1.5 text-[11px] text-[#B45309] mt-1">
                          <TriangleAlert className="w-3.5 h-3.5 shrink-0 mt-px" />
                          {flag.message}
                        </p>
                      ))}
                    </div>

                    <button
                      onClick={() => onPick(candidate.volunteer.id)}
                      disabled={blocked || picking}
                      className={`inline-flex items-center gap-1 px-3 h-8 rounded-lg text-[12px] font-semibold shrink-0 transition-colors ${
                        blocked
                          ? "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed"
                          : "bg-[#6D28D9] text-white hover:bg-[#5B21B6] disabled:opacity-50"
                      }`}
                      title={blocked ? "Há um impedimento para esta data" : "Escalar"}
                    >
                      <Check className="w-3.5 h-3.5" strokeWidth={2.6} />
                      Escalar
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
