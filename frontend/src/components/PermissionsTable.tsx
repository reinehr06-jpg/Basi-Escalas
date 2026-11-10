"use client";

import React from "react";
import { useTranslation } from "react-i18next";

interface PermissionsTableRow {
  date: string;
  action: React.ReactNode;
  responsible: string;
}

interface PermissionsTableProps {
  rows: PermissionsTableRow[];
  className?: string;
  responsibleLabel?: string;
}

export default function PermissionsTable({ rows, className = "", responsibleLabel }: PermissionsTableProps) {
  const { t } = useTranslation();

  return (
    <div className={`border border-[#E5E7EB] rounded-[12px] overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <div className="min-w-[520px]">
          <div className="bg-[#FCFCFD] px-[20px] py-[12px] border-b border-[#E5E7EB] grid grid-cols-[1fr_2fr_1fr] gap-[16px]">
            <span className="text-[12px] font-[700] text-[#6B7280] uppercase tracking-wider">{t("Date / Time")}</span>
            <span className="text-[12px] font-[700] text-[#6B7280] uppercase tracking-wider">{t("Action Performed")}</span>
            <span className="text-[12px] font-[700] text-[#6B7280] uppercase tracking-wider text-right">{t(responsibleLabel ?? "Responsible")}</span>
          </div>
          <div className="flex flex-col">
            {rows.map((row, idx) => (
              <div
                key={idx}
                className={`px-[20px] py-[16px] grid grid-cols-[1fr_2fr_1fr] gap-[16px] items-center bg-white hover:bg-[#F9FAFB] transition-colors ${
                  idx < rows.length - 1 ? "border-b border-[#F1F1F4]" : ""
                }`}
              >
                <span className="text-[13px] font-[500] text-[#4B5563]">{row.date}</span>
                <span className="text-[13px] text-[#1A1A2E]">{row.action}</span>
                <span className="text-[13px] font-[500] text-[#9CA3AF] text-right">{row.responsible}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
