"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-11 h-11 rounded-xl bg-[#F3F4F6] flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-[#9CA3AF]" strokeWidth={2} />
      </div>
      <p className="text-sm font-semibold text-[#1A1A2E]">{title}</p>
      {description && <p className="text-xs text-[#6B7280] mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
