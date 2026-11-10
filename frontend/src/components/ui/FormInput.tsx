"use client";

import React, { InputHTMLAttributes } from "react";
import { AlertCircle } from "lucide-react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  error?: string;
  required?: boolean;
}

export default function FormInput({ label, error, required, className = "", ...props }: FormInputProps) {
  return (
    <div className="flex flex-col gap-[6px] group w-full">
      <div className="flex justify-between items-center">
        <label className="text-[13px] font-[600] text-[#4B5563]">
          {label} {required && <span className="text-[#EF4444] ml-0.5">*</span>}
        </label>
        {error && <span className="text-[11px] font-[500] text-[#EF4444] animate-in fade-in">{error}</span>}
      </div>
      <div className="relative">
        <input
          {...props}
          className={`w-full h-[42px] px-[12px] ${error ? 'pr-[36px]' : ''} bg-white border rounded-[8px] text-[13px] text-[#1A1A2E] placeholder-[#9CA3AF] outline-none transition-all focus:ring-1 focus:ring-[#6D28D9] ${error ? 'border-[#EF4444] bg-white text-[#B91C1C]' : 'border-[#E5E7EB] focus:border-[#6D28D9] hover:border-[#D1D5DB]'} ${className}`}
        />
        {error && (
          <div className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[#EF4444] pointer-events-none">
            <AlertCircle className="w-[16px] h-[16px]" strokeWidth={2.4} />
          </div>
        )}
      </div>
    </div>
  );
}
