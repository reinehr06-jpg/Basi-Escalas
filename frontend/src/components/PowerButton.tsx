"use client";

import React from "react";
import { Power } from "lucide-react";

interface PowerButtonProps {
  isActive: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
}

export function PowerButton({
  isActive,
  onClick,
  title,
  size = "md",
  className = "",
  disabled = false,
}: PowerButtonProps) {
  const sizeClasses = {
    sm: "w-[26px] h-[26px] rounded-[7px]",
    md: "w-[30px] h-[30px] rounded-[8px]",
    lg: "w-[34px] h-[34px] rounded-[10px]",
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const defaultTitle = isActive
    ? "Ativo (Clique para desativar)"
    : "Inativo (Clique para ativar)";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title || defaultTitle}
      className={`inline-flex items-center justify-center transition-all duration-150 shrink-0 cursor-pointer border ${sizeClasses[size]} ${
        isActive
          ? "bg-[#EBFBF3] border-[#9DE8C4] text-[#0E9F6E] hover:bg-[#DCFCE7] hover:border-[#86EFAC]"
          : "bg-[#FEF2F2] border-[#FECACA] text-[#DC2626] hover:bg-[#FEE2E2] hover:border-[#FCA5A5]"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      <Power size={iconSizes[size]} strokeWidth={2.4} />
    </button>
  );
}

export default PowerButton;
