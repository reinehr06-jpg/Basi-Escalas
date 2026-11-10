"use client";

import React from "react";
import CustomSelect from "@/components/CustomSelect";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PaginationProps {
  total: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  leftContent?: React.ReactNode;
}

export default function Pagination({
  total,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  leftContent,
}: PaginationProps) {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, total);

    const getPagesToShow = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const pageSizeOptions = [
    { value: "10", label: "10" },
    { value: "20", label: "20" },
    { value: "50", label: "50" },
  ];



  return (
    <div className="p-[18px_24px_20px_24px] border-t border-[#F1F1F4] bg-white flex flex-col sm:flex-row items-center justify-between text-[13px] text-[#6B7280] gap-4">
      {/* Left section: Linhas por página */}
      <div className="flex items-center justify-center sm:justify-start gap-[8px] flex-wrap w-full sm:w-auto">
        {leftContent && <div className="flex items-center gap-[8px] mr-2 border-r border-[#E5E7EB] pr-4">{leftContent}</div>}
        <span>{t("Rows per page")}</span>
        <CustomSelect
          options={pageSizeOptions}
          value={String(pageSize)}
          onChange={(v) => onPageSizeChange(Number(v))}
          className="w-[80px]"
          triggerClassName="!min-h-[32px] !h-[32px]"
          compact={true}
        />
      </div>

      {/* Right section: Info & Navegação */}
      <div className="flex flex-col sm:flex-row items-center gap-[12px] w-full sm:w-auto justify-center sm:justify-end">
        

        <div className="flex items-center gap-[4px]">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            className="w-[28px] h-[28px] flex items-center justify-center text-[#9CA3AF] disabled:opacity-30 disabled:cursor-not-allowed hover:text-[#6B7280] transition-colors"
          >
            <ChevronsLeft className="w-[15px] h-[15px]" strokeWidth={2.4} />
          </button>
          
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="w-[28px] h-[28px] flex items-center justify-center text-[#9CA3AF] disabled:opacity-30 disabled:cursor-not-allowed hover:text-[#6B7280] transition-colors"
          >
            <ChevronLeft className="w-[15px] h-[15px]" strokeWidth={2.4} />
          </button>
          
          {getPagesToShow().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' ? onPageChange(page) : null}
              disabled={page === '...'}
              className={`w-[30px] h-[30px] flex items-center justify-center rounded-[6px] text-[13px] font-[600] transition-colors ${
                page === currentPage
                  ? "border border-[#7C3AED] bg-[#F4EEFF] text-[#6D28D9]"
                  : page === '...'
                  ? "text-[#9CA3AF] cursor-default"
                  : "text-[#6B7280] hover:bg-[#F3F4F6] border border-transparent"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="w-[28px] h-[28px] flex items-center justify-center text-[#9CA3AF] disabled:opacity-30 disabled:cursor-not-allowed hover:text-[#6B7280] transition-colors"
          >
            <ChevronRight className="w-[15px] h-[15px]" strokeWidth={2.4} />
          </button>

          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            className="w-[28px] h-[28px] flex items-center justify-center text-[#9CA3AF] disabled:opacity-30 disabled:cursor-not-allowed hover:text-[#6B7280] transition-colors"
          >
            <ChevronsRight className="w-[15px] h-[15px]" strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}
