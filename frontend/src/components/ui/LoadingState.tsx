"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";

export interface LoadingStateProps {
  /**
   * "brand": Full-featured branded loader with ambient glow and orbital ring
   * "dashboard": High-fidelity skeleton UI replicating analytical dashboards
   * "card": Compact container loader for cards and modals
   * "minimal": Inline spinner with subtle glow
   */
  variant?: "brand" | "dashboard" | "card" | "minimal";
  title?: string;
  subtitle?: string;
  className?: string;
  minHeight?: string;
}

export default function LoadingState({
  variant = "brand",
  title,
  subtitle,
  className = "",
  minHeight,
}: LoadingStateProps) {
  const { t } = useTranslation();

  // 1. Dashboard Skeleton variant (for dashboards, pastoral care, analytics)
  if (variant === "dashboard") {
    return (
      <div
        className={`w-full max-w-[1480px] p-[0_24px_28px_24px] flex-1 flex flex-col justify-between animate-fade-in ${className}`}
      >
        {/* Header Skeleton */}
        <div className="flex items-center gap-[14px] py-[16px] pb-[20px]">
          <div className="w-[44px] h-[44px] rounded-[12px] bg-[#EDE9FE]/70 animate-shimmer shrink-0 shadow-2xs" />
          <div className="flex flex-col gap-2">
            <div className="w-48 h-6 rounded-lg bg-gray-200/80 animate-shimmer" />
            <div className="w-72 h-3.5 rounded-md bg-gray-100 animate-shimmer" />
          </div>
        </div>

        {/* 12-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-[20px] items-stretch flex-1">
          {/* Main Content Area (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-[20px]">
            {/* 4 Metric Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px]">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="bg-white rounded-[16px] p-5 border border-purple-100/50 shadow-2xs flex flex-col justify-between h-[126px] relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-24 h-3.5 rounded bg-gray-200/80 animate-shimmer" />
                    <div className="w-8 h-8 rounded-lg bg-[#EDE9FE]/80 animate-shimmer" />
                  </div>
                  <div>
                    <div className="w-20 h-7 rounded-md bg-gray-200/90 animate-shimmer" />
                    <div className="w-28 h-3 rounded-full bg-purple-50 animate-shimmer mt-2" />
                  </div>
                </div>
              ))}
            </div>

            {/* Chart Area Skeleton */}
            <div className="bg-white rounded-[16px] p-6 border border-purple-100/50 shadow-2xs flex-1 flex flex-col justify-between min-h-[380px] relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-[#EDE9FE] animate-shimmer" />
                  <div className="w-40 h-5 rounded-md bg-gray-200/80 animate-shimmer" />
                </div>
                <div className="w-32 h-7 rounded-full bg-gray-100 animate-shimmer" />
              </div>

              {/* Shimmering Chart Bars Simulation */}
              <div className="flex items-end justify-between gap-3 h-[220px] pt-8 px-4">
                {[35, 65, 45, 80, 55, 90, 70, 85, 60, 95, 50, 75].map((heightPct, idx) => (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                  >
                    <div
                      className="w-full rounded-t-md animate-shimmer-fast"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: "#EDE9FE",
                      }}
                    />
                    <div className="w-4 h-2 rounded bg-gray-200/70 animate-shimmer" />
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div className="w-32 h-3 rounded bg-gray-100 animate-shimmer" />
                <div className="w-24 h-3 rounded bg-gray-100 animate-shimmer" />
              </div>
            </div>
          </div>

          {/* Side Cards Area (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-[20px]">
            {/* Side Card 1 */}
            <div className="bg-white rounded-[16px] p-5 border border-purple-100/50 shadow-2xs flex-1 flex flex-col justify-between min-h-[260px] relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="w-36 h-4.5 rounded bg-gray-200/80 animate-shimmer" />
                <div className="w-6 h-6 rounded-md bg-[#EDE9FE] animate-shimmer" />
              </div>
              <div className="flex flex-col gap-3 py-3">
                {[1, 2, 3].map((row) => (
                  <div
                    key={row}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/70"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#EDE9FE] animate-shimmer" />
                      <div className="flex flex-col gap-1.5">
                        <div className="w-24 h-3 rounded bg-gray-200/80 animate-shimmer" />
                        <div className="w-16 h-2.5 rounded bg-gray-100 animate-shimmer" />
                      </div>
                    </div>
                    <div className="w-12 h-5 rounded-full bg-purple-100/60 animate-shimmer" />
                  </div>
                ))}
              </div>
              <div className="w-full h-8 rounded-lg bg-gray-100 animate-shimmer" />
            </div>

            {/* Side Card 2 */}
            <div className="bg-white rounded-[16px] p-5 border border-purple-100/50 shadow-2xs flex-1 flex flex-col justify-between min-h-[220px] relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="w-32 h-4.5 rounded bg-gray-200/80 animate-shimmer" />
                <div className="w-6 h-6 rounded-md bg-[#EDE9FE] animate-shimmer" />
              </div>
              <div className="flex flex-col gap-3 py-2">
                <div className="w-full h-3 rounded bg-gray-100 animate-shimmer" />
                <div className="w-4/5 h-3 rounded bg-gray-100 animate-shimmer" />
                <div className="w-3/5 h-3 rounded bg-gray-100 animate-shimmer" />
              </div>
              <div className="w-full h-8 rounded-lg bg-purple-50 animate-shimmer" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Minimal variant (for small sections or inside buttons)
  if (variant === "minimal") {
    return (
      <div
        className={`inline-flex items-center gap-2 text-violet-700 ${className}`}
      >
        <div className="relative w-4 h-4">
          <div className="w-4 h-4 rounded-full border-2 border-violet-200 border-t-violet-700 animate-spin" />
        </div>
        <span className="text-xs font-medium text-gray-600">
          {title || t("Loading...")}
        </span>
      </div>
    );
  }

  // 3. Card variant (for container boxes / modals)
  if (variant === "card") {
    return (
      <div
        className={`w-full p-8 flex flex-col items-center justify-center rounded-2xl bg-white border border-purple-100/60 shadow-xs relative overflow-hidden ${
          minHeight || "min-h-[240px]"
        } ${className}`}
      >
        <div className="relative mb-3 flex items-center justify-center">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700 shadow-xs">
            <Sparkles className="w-5 h-5 animate-pulse text-purple-600" />
          </div>
          <div className="absolute -inset-1 rounded-xl border border-purple-300/60 border-t-purple-600 animate-spin" />
        </div>
        <p className="text-sm font-medium text-gray-800">
          {title || t("Loading...")}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {subtitle || t("Preparing your environment...")}
        </p>
      </div>
    );
  }

  // 4. Brand variant (Default full-page/section experience)
  return (
    <div
      className={`w-full flex-1 flex flex-col items-center justify-center relative overflow-hidden p-6 select-none ${
        minHeight || "min-h-[380px]"
      } ${className}`}
    >
      {/* Ambient Pulsing Aura Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-tr from-violet-600/15 via-purple-500/15 to-fuchsia-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

      {/* Center Emblem Container */}
      <div className="relative flex flex-col items-center z-10">
        <div className="relative flex items-center justify-center w-24 h-24 mb-6">
          {/* Outer Guide Ring */}
          <div className="absolute inset-0 rounded-full border border-purple-200/50" />

          {/* Spinning Gradient Orbital Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#7C3AED] border-r-[#A855F7] animate-spin" />

          {/* Orbital Micro-glow Dot */}
          <div className="absolute -top-0.5 right-4 w-2 h-2 rounded-full bg-[#7C3AED] shadow-[0_0_10px_#7C3AED]" />

          {/* Floating Brand Badge / Icon */}
          <div className="w-14 h-14 rounded-2xl bg-white/90 backdrop-blur-md shadow-lg shadow-purple-600/10 border border-purple-100 flex items-center justify-center text-[#7C3AED] animate-float-soft">
            <svg
              className="w-7 h-7 text-[#7C3AED]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Modern geometric stylized crown/cross motif */}
              <path d="M12 2v20M2 12h20M7 7l10 10M17 7L7 17" opacity="0.15" />
              <circle cx="12" cy="12" r="3" fill="#7C3AED" fillOpacity="0.15" />
              <path
                d="M12 3v18M6 8h12M8 16h8"
                stroke="url(#basileia-gradient)"
                strokeWidth="2.4"
              />
              <defs>
                <linearGradient
                  id="basileia-gradient"
                  x1="6"
                  y1="3"
                  x2="18"
                  y2="21"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#6D28D9" />
                  <stop offset="1" stopColor="#9333EA" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Text Presentation */}
        <h3 className="text-[17px] font-semibold text-gray-900 tracking-tight text-center">
          {title || t("Loading...")}
        </h3>

        <p className="text-[13px] text-gray-500 mt-1 text-center font-normal max-w-xs">
          {subtitle || t("Preparing your environment...")}
        </p>

        {/* Shimmer Progress Bar */}
        <div className="w-48 h-1.5 bg-purple-100/90 rounded-full overflow-hidden relative mt-4 shadow-inner">
          <div className="h-full w-24 bg-gradient-to-r from-[#6D28D9] via-[#A855F7] to-[#7C3AED] rounded-full animate-indeterminate" />
        </div>
      </div>
    </div>
  );
}

