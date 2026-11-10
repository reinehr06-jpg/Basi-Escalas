"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Trash2, X } from "lucide-react";

export interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  isLoading?: boolean;
}

export default function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  isLoading = false,
}: DeleteModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm flex items-center justify-center p-[16px] sm:p-[20px] animate-in fade-in duration-200"
      onClick={() => !isLoading && onClose()}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[440px] shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-[18px_24px] border-b border-[#F1F1F4] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" strokeWidth={2.2} />
            </div>
            <div className="flex flex-col">
              <h2 className="text-[17px] font-bold text-[#1A1A2E] leading-tight">
                {title ? t(title) : t("Confirm Deletion")}
              </h2>
            </div>
          </div>
          <button
            disabled={isLoading}
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#6B7280] hover:text-[#111827] flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </div>

        {/* Body */}
        <div className="p-[20px_24px] flex flex-col gap-4">
          <p className="text-sm text-[#4B5563]">
            {description ? t(description) : t("Are you sure you want to delete this item? This action cannot be undone.")}
          </p>

          {itemName && (
            <div className="p-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                {t("Selected Item")}
              </span>
              <span className="text-sm font-bold text-[#111827]">
                {itemName}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-[16px_24px] bg-[#FCFCFD] border-t border-[#F1F1F4] flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-[#4B5563] hover:text-[#111827] rounded-lg hover:bg-[#F3F4F6] transition-colors"
          >
            {t("Cancel")}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg transition-all bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-[0_4px_14px_rgba(220,38,38,0.25)] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2.2} />
            {isLoading ? t("Deleting...") : t("Delete")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
