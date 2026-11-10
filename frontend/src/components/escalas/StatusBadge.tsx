"use client";

import React from "react";
import { useTranslation } from "react-i18next";

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
  draft: { label: "Draft", tone: "neutral" },
  published: { label: "Published", tone: "purple" },
  closed: { label: "Closed", tone: "neutral" },
  // escalação
  pending: { label: "Pending", tone: "warning" },
  confirmed: { label: "Confirmed", tone: "success" },
  declined: { label: "Declined", tone: "danger" },
  replaced: { label: "Replaced", tone: "info" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  // presença
  present: { label: "Present", tone: "success" },
  late: { label: "Late", tone: "warning" },
  absent: { label: "Absent", tone: "danger" },
  justified: { label: "Justified", tone: "info" },
  // evento
  planned: { label: "Planned", tone: "neutral" },
  done: { label: "Done", tone: "info" },
  // voluntário
  active: { label: "Active", tone: "success" },
  inactive: { label: "Inactive", tone: "neutral" },
  on_leave: { label: "On leave", tone: "warning" },
  // troca / ausência
  open: { label: "Open", tone: "warning" },
  accepted: { label: "Accepted", tone: "info" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  expired: { label: "Expired", tone: "neutral" },
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
  const { t } = useTranslation();

  if (!status && !label) return null;

  const mapped = status ? MAP[status] : undefined;
  const finalTone = tone ?? mapped?.tone ?? "neutral";
  const finalLabel = label ?? mapped?.label ?? status;

  return (
    <span
      className={`inline-flex items-center h-[22px] px-2 rounded-md border text-[11px] font-semibold whitespace-nowrap ${TONES[finalTone]}`}
    >
      {finalLabel ? t(finalLabel) : null}
    </span>
  );
}
