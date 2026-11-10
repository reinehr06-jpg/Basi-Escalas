"use client";

import React from "react";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "purple";

const TONES: Record<Tone, string> = {
  neutral: "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]",
  success: "bg-[#10B981]/10 text-[#047857] border-[#10B981]/20",
  warning: "bg-[#F59E0B]/10 text-[#B45309] border-[#F59E0B]/20",
  danger: "bg-[#EF4444]/10 text-[#B91C1C] border-[#EF4444]/20",
  info: "bg-[#0EA5E9]/10 text-[#0369A1] border-[#0EA5E9]/20",
  purple: "bg-[#6D28D9]/10 text-[#5B21B6] border-[#6D28D9]/20",
};

/** Rótulo e tom de cada estado do domínio, num só lugar. */
const MAP: Record<string, { label: string; tone: Tone }> = {
  // escala
  draft: { label: "Rascunho", tone: "neutral" },
  published: { label: "Publicada", tone: "purple" },
  closed: { label: "Encerrada", tone: "neutral" },
  // escalação
  pending: { label: "Pendente", tone: "warning" },
  confirmed: { label: "Confirmado", tone: "success" },
  declined: { label: "Recusado", tone: "danger" },
  replaced: { label: "Substituído", tone: "info" },
  cancelled: { label: "Cancelado", tone: "neutral" },
  // presença
  present: { label: "Presente", tone: "success" },
  late: { label: "Atrasado", tone: "warning" },
  absent: { label: "Faltou", tone: "danger" },
  justified: { label: "Justificado", tone: "info" },
  // evento
  planned: { label: "Planejado", tone: "neutral" },
  done: { label: "Realizado", tone: "info" },
  // voluntário
  active: { label: "Ativo", tone: "success" },
  inactive: { label: "Inativo", tone: "neutral" },
  on_leave: { label: "Afastado", tone: "warning" },
  // troca / ausência
  open: { label: "Aberta", tone: "warning" },
  accepted: { label: "Aceita", tone: "info" },
  approved: { label: "Aprovada", tone: "success" },
  rejected: { label: "Recusada", tone: "danger" },
  expired: { label: "Expirada", tone: "neutral" },
};

export default function StatusBadge({
  status,
  label,
  tone,
}: {
  status?: string | null;
  label?: string;
  tone?: Tone;
}) {
  if (!status && !label) return null;

  const mapped = status ? MAP[status] : undefined;
  const finalTone = tone ?? mapped?.tone ?? "neutral";
  const finalLabel = label ?? mapped?.label ?? status;

  return (
    <span
      className={`inline-flex items-center h-[22px] px-2 rounded-md border text-[11px] font-semibold whitespace-nowrap ${TONES[finalTone]}`}
    >
      {finalLabel}
    </span>
  );
}
