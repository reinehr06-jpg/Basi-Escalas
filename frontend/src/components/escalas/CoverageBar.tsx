"use client";

import React from "react";

/** Barra de cobertura: verde completa, âmbar parcial, vermelha crítica. */
export default function CoverageBar({
  filled,
  needed,
  showLabel = true,
  height = 6,
}: {
  filled: number;
  needed: number;
  showLabel?: boolean;
  height?: number;
}) {
  const rate = needed > 0 ? Math.min(100, Math.round((filled / needed) * 100)) : 100;
  const color = rate >= 100 ? "#10B981" : rate >= 60 ? "#F59E0B" : "#EF4444";

  return (
    <div className="flex items-center gap-2 w-full min-w-0">
      <div
        className="flex-1 bg-[#F1F1F4] rounded-full overflow-hidden min-w-[48px]"
        style={{ height }}
        role="progressbar"
        aria-valuenow={rate}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${filled} de ${needed} vagas preenchidas`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${rate}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <span className="text-[11px] font-semibold tabular-nums shrink-0" style={{ color }}>
          {filled}/{needed}
        </span>
      )}
    </div>
  );
}
