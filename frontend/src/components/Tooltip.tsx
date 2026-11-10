"use client";

import React, { useState, useRef, useEffect } from "react";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
  delay?: number;
}

export default function Tooltip({
  content,
  children,
  position = "top",
  className = "",
  delay = 50,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!content) return <>{children}</>;

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-[#0F172A] border-x-transparent border-b-transparent border-t-[5px] border-x-[5px] border-b-0",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-[#0F172A] border-x-transparent border-t-transparent border-b-[5px] border-x-[5px] border-t-0",
    left: "left-full top-1/2 -translate-y-1/2 border-l-[#0F172A] border-y-transparent border-r-transparent border-l-[5px] border-y-[5px] border-r-0",
    right: "right-full top-1/2 -translate-y-1/2 border-r-[#0F172A] border-y-transparent border-l-transparent border-r-[5px] border-y-[5px] border-l-0",
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-[99999] pointer-events-none px-2.5 py-1 text-[11px] font-semibold text-white bg-[#0F172A] rounded-lg shadow-[0_6px_20px_rgba(15,23,42,0.35)] border border-slate-700/40 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150 select-none ${positionClasses[position]}`}
        >
          {content}
          <span
            className={`absolute w-0 h-0 border-solid ${arrowClasses[position]}`}
          />
        </div>
      )}
    </div>
  );
}
