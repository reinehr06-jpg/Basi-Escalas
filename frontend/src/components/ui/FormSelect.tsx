"use client";

import React from "react";
import CustomSelect, { SelectOption } from "@/components/CustomSelect";
import { AlertCircle } from "lucide-react";

interface FormSelectProps {
  label: React.ReactNode;
  error?: string;
  required?: boolean;
  
  options: SelectOption[];
  value?: string | string[];
  onChange?: (value: any) => void;
  placeholder?: string;
  disabled?: boolean;
  multiple?: boolean;
  searchable?: boolean;
  onSearchChange?: (term: string) => void;
  className?: string;
}

export default function FormSelect({ label, error, required, className = "", ...props }: FormSelectProps) {
  return (
    <div className={`flex flex-col gap-[6px] group w-full ${className}`}>
      <div className="flex justify-between items-center">
        <label className="text-[13px] font-[600] text-[#4B5563]">
          {label} {required && <span className="text-[#EF4444] ml-0.5">*</span>}
        </label>
        {error && <span className="text-[11px] font-[500] text-[#EF4444] animate-in fade-in">{error}</span>}
      </div>
      <div className="relative">
        <CustomSelect
          {...props}
          error={!!error}
          className={`${error ? 'has-error' : ''}`}
        />
        {error && (
          <div className="absolute right-[36px] top-1/2 -translate-y-1/2 text-[#EF4444] pointer-events-none">
            <AlertCircle className="w-[16px] h-[16px]" strokeWidth={2.4} />
          </div>
        )}
      </div>
    </div>
  );
}
