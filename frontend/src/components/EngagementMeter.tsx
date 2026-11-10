"use client";

import { Activity } from "lucide-react";

function engagementBand(value: number) {
  if (value >= 70) return { bar: "#10B981", text: "#059669" };
  if (value >= 40) return { bar: "#F59E0B", text: "#B45309" };
  return { bar: "#EF4444", text: "#DC2626" };
}

export default function EngagementMeter({ value }: { value: number }) {
  const { bar, text } = engagementBand(value);
  return (
    <div className="flex items-center gap-[6px]">
      <Activity className="w-[13px] h-[13px] shrink-0" style={{ color: text }} strokeWidth={2.4} />
      <div className="w-[52px] h-[6px] bg-[#F3F4F6] rounded-full overflow-hidden shrink-0">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: bar }} />
      </div>
      <span className="text-[11px] font-[700] shrink-0" style={{ color: text }}>{value}%</span>
    </div>
  );
}
