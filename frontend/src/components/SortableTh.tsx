"use client";

import { ArrowUp, ArrowDown } from "lucide-react";
import type { SortDirection } from "@/hooks/useSortableList";

interface SortableThProps {
  label: string;
  sortKey: string;
  activeKey: string;
  direction: SortDirection;
  onSort: (key: string) => void;
  className?: string;
}

export default function SortableTh({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  className = "",
}: SortableThProps) {
  const isActive = sortKey === activeKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`flex items-center gap-1 text-xs font-bold transition-colors ${isActive ? "text-gray-700" : "text-gray-500 hover:text-gray-700"} ${className}`}
    >
      <span className="truncate">{label}</span>
      {/* Só mostra a setinha depois que o usuário clica na coluna para
          ordenar por ela — enquanto inativa, nenhum ícone é exibido. */}
      {isActive && (
        direction === "asc" ? (
          <ArrowUp className="w-3 h-3 shrink-0" strokeWidth={2.5} />
        ) : (
          <ArrowDown className="w-3 h-3 shrink-0" strokeWidth={2.5} />
        )
      )}
    </button>
  );
}
