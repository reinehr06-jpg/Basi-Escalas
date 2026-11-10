"use client";

import React from "react";

interface ResponsiveTableCardProps {
  children: React.ReactNode;
  minWidth?: string;
  className?: string;
}

export default function ResponsiveTableCard({
  children,
  minWidth = "640px",
  className = "",
}: ResponsiveTableCardProps) {
  return (
    <div className={`flex-1 flex flex-col overflow-x-auto ${className}`}>
      <div className="flex flex-col flex-1" style={{ minWidth }}>
        {children}
      </div>
    </div>
  );
}
