"use client";

import React, { useState, useRef, useEffect } from "react";
import { Download, FileText, FileSpreadsheet, FileJson } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function ExportDropdown() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = (type: string) => {
    toast.info(`Exportando ${type}`, {
      description: `O arquivo ${type} está sendo preparado para download.`
    });
    setOpen(false);
  };

  return (
    <div className="relative shrink-0 z-50" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-[6px] h-[40px] px-[16px] bg-white border border-[#E5E7EB] text-[#374151] text-[13px] font-[600] rounded-[8px] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all shadow-sm focus:outline-none"
      >
        <Download className="w-[16px] h-[16px] text-[#6B7280]" strokeWidth={2.4} />
        EXPORTAR
      </button>

      {open && (
        <div className="absolute top-[calc(100%+8px)] right-0 w-[160px] bg-white border border-[#E5E7EB] rounded-[10px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] py-[8px] animate-in fade-in slide-in-from-top-2 duration-200">
          <button onClick={() => handleExport("PDF")} className="w-full text-left px-[16px] py-[10px] text-[13px] font-[500] text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#1A1A2E] flex items-center gap-[10px] transition-colors">
            <div className="w-[24px] h-[24px] rounded-[6px] bg-[#EF4444]/10 flex items-center justify-center">
              <FileText className="w-[14px] h-[14px] text-[#EF4444]" strokeWidth={2.4} />
            </div>
            {t("Export PDF")}
          </button>
          
          <button onClick={() => handleExport("Excel")} className="w-full text-left px-[16px] py-[10px] text-[13px] font-[500] text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#1A1A2E] flex items-center gap-[10px] transition-colors">
            <div className="w-[24px] h-[24px] rounded-[6px] bg-[#10B981]/10 flex items-center justify-center">
              <FileSpreadsheet className="w-[14px] h-[14px] text-[#10B981]" strokeWidth={2.4} />
            </div>
            {t("Export Excel")}
          </button>
          
          <button onClick={() => handleExport("CSV")} className="w-full text-left px-[16px] py-[10px] text-[13px] font-[500] text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#1A1A2E] flex items-center gap-[10px] transition-colors">
            <div className="w-[24px] h-[24px] rounded-[6px] bg-[#3B82F6]/10 flex items-center justify-center">
              <FileJson className="w-[14px] h-[14px] text-[#3B82F6]" strokeWidth={2.4} />
            </div>
            {t("Export CSV")}
          </button>
        </div>
      )}
    </div>
  );
}
