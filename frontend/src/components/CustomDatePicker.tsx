"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getDateFormat, formatDateForModel, DateSegment } from "@/lib/dateFormats";

interface CustomDatePickerProps {
  error?: boolean;
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  align?: "left" | "right";
  className?: string;
  variant?: "default" | "transparent";
  label?: string;
  triggerClassName?: string;
  countryCode?: string;
}

const SEGMENT_LENGTHS: Record<DateSegment, number> = { day: 2, month: 2, year: 4 };

function digitsToParts(digits: string, order: DateSegment[]) {
  const parts: Record<DateSegment, string> = { day: "", month: "", year: "" };
  let offset = 0;
  for (const seg of order) {
    const len = SEGMENT_LENGTHS[seg];
    parts[seg] = digits.slice(offset, offset + len);
    offset += len;
  }
  return parts;
}

function formatDigitsForDisplay(digits: string, order: DateSegment[], separator: string) {
  let result = "";
  let offset = 0;
  for (let i = 0; i < order.length; i++) {
    const len = SEGMENT_LENGTHS[order[i]];
    const part = digits.slice(offset, offset + len);
    if (!part) break;
    if (i > 0) result += separator;
    result += part;
    offset += len;
    if (part.length < len) break;
  }
  return result;
}

function isoToDigits(iso: string, order: DateSegment[]): string {
  if (!iso) return "";
  const normalized = formatDateForModel(iso) || iso;
  const match = normalized.match(/^(\d{4})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{1,2})/);
  if (!match) return "";
  const year = match[1];
  const month = match[2].padStart(2, "0");
  const day = match[3].padStart(2, "0");
  const parts: Record<DateSegment, string> = { day, month, year };
  return order.map((seg) => parts[seg]).join("");
}

export default function CustomDatePicker({
  value,
  onChange,
  placeholder,
  disabled = false,
  error = false,
  align = "left",
  className = "",
  variant = "default",
  label,
  triggerClassName,
  countryCode,
}: CustomDatePickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [digits, setDigits] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatConfig = useMemo(() => getDateFormat(countryCode), [countryCode]);
  const { order, separator } = formatConfig;
  const activePlaceholder = placeholder && placeholder !== "DD/MM/AAAA" && placeholder !== "MM/DD/YYYY" ? placeholder : formatConfig.placeholder;
  const totalLen = SEGMENT_LENGTHS.day + SEGMENT_LENGTHS.month + SEGMENT_LENGTHS.year;

  // Sincroniza dígitos digitados com o valor externo (ISO) — SEM conversão UTC
  useEffect(() => {
    const externalDigits = value ? isoToDigits(value, order) : "";
    setDigits((current) => (current === externalDigits ? current : externalDigits));
    if (value) {
      const match = value.match(/^(\d{4})[-/.](\d{2})[-/.](\d{2})/);
      if (match) {
        const y = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        setCurrentMonth(new Date(y, m - 1, 1));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, order.join(",")]);

  // Parse string value (YYYY-MM-DD) usando valores locais de ano/mês/dia
  const selectedDate = useMemo(() => {
    if (!value) return null;
    const match = value.match(/^(\d{4})[-/.](\d{2})[-/.](\d{2})/);
    if (match) {
      return new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
    }
    return null;
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    if (!disabled) setIsOpen(!isOpen);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleSelectDate = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    onChange?.(`${year}-${month}-${dayStr}`);
    setIsOpen(false);
  };

  const handleTypedChange = (raw: string) => {
    const newDigits = raw.replace(/\D/g, "").slice(0, totalLen);
    setDigits(newDigits);

    if (newDigits.length === 0) {
      onChange?.("");
      return;
    }

    if (newDigits.length === totalLen) {
      const parts = digitsToParts(newDigits, order);
      let month = Math.min(Math.max(parseInt(parts.month, 10) || 1, 1), 12);
      const year = parseInt(parts.year, 10) || new Date().getFullYear();
      const daysInMonth = new Date(year, month, 0).getDate();
      let day = Math.min(Math.max(parseInt(parts.day, 10) || 1, 1), daysInMonth);

      const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      onChange?.(iso);
      setCurrentMonth(new Date(year, month - 1, 1));
    }
  };

  const maskPlaceholder = useMemo(() => {
    const labelFor: Record<DateSegment, string> = { day: "DD", month: "MM", year: "AAAA" };
    return order.map((seg) => labelFor[seg]).join(separator);
  }, [order, separator]);

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    const weekDays = [0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
      try {
        const d = new Date(2023, 0, 1 + dayOffset);
        return new Intl.DateTimeFormat(formatConfig.locale, { weekday: "narrow" }).format(d);
      } catch {
        return ["D", "S", "T", "Q", "Q", "S", "S"][dayOffset];
      }
    });

    // Week day headers
    const headers = weekDays.map((wd, i) => (
      <div key={`header-${i}`} className="text-center text-[12px] font-[600] text-[#9CA3AF] mb-2">
        {wd}
      </div>
    ));

    // Empty cells for alignment
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-[30px] h-[30px]"></div>);
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const isSelected = selectedDate?.getDate() === d && selectedDate?.getMonth() === month && selectedDate?.getFullYear() === year;
      const isToday = new Date().getDate() === d && new Date().getMonth() === month && new Date().getFullYear() === year;

      days.push(
        <div
          key={`day-${d}`}
          onClick={(e) => {
            e.stopPropagation();
            handleSelectDate(d);
          }}
          className={`w-[30px] h-[30px] flex items-center justify-center rounded-full text-[13px] cursor-pointer transition-colors
            ${isSelected ? "bg-[#7C3AED] text-white font-[600] shadow-sm" :
              isToday ? "bg-[#F4EEFF] text-[#7C3AED] font-[600]" :
                "text-[#374151] hover:bg-[#F3F4F6]"}
          `}
        >
          {d}
        </div>
      );
    }

    let displayMonth = "";
    try {
      const monthStr = new Intl.DateTimeFormat(formatConfig.locale, { month: "long" }).format(new Date(year, month, 1));
      displayMonth = monthStr.charAt(0).toUpperCase() + monthStr.slice(1);
    } catch {
      const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      displayMonth = monthNames[month] || "";
    }

    return (
      <div className="p-3 w-[260px]">
        {/* Header (Month / Year) */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-[#F3F4F6] rounded-full text-[#6B7280]">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[14px] font-[600] text-[#1A1A2E]">
            {displayMonth} {year}
          </span>
          <button onClick={handleNextMonth} className="p-1 hover:bg-[#F3F4F6] rounded-full text-[#6B7280]">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1">
          {headers}
          {days}
        </div>
      </div>
    );
  };

  const effectiveSeparator = variant === "transparent" ? " / " : separator;
  const displayText = formatDigitsForDisplay(digits, order, effectiveSeparator);

  return (
    <div className={`relative ${className || (variant === "transparent" ? "" : "w-full")}`} ref={dropdownRef}>
      {variant === "transparent" ? (
        <div
          onClick={() => {
            if (!disabled) {
              setIsOpen(!isOpen);
              inputRef.current?.focus();
            }
          }}
          className={`flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none py-1 px-1 rounded-lg transition-colors hover:bg-white/5 ${
            disabled ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          {label && (
            <span className="text-[12px] sm:text-[13px] font-[500] text-purple-200 select-none shrink-0">
              {label}
            </span>
          )}
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            disabled={disabled}
            value={displayText}
            onFocus={() => !disabled && setIsOpen(true)}
            onChange={(e) => handleTypedChange(e.target.value)}
            placeholder={placeholder === "DD/MM/AAAA" ? maskPlaceholder.split(separator).join(" / ") : placeholder}
            className="w-[102px] sm:w-[110px] bg-transparent outline-none border-none text-white font-[600] text-[13px] sm:text-[14px] tracking-wide placeholder-white/40 cursor-pointer"
          />
        </div>
      ) : (
        <div
          className={`h-[38px] px-[12px] flex items-center gap-2 bg-white border rounded-[8px] transition-all
            ${disabled ? "bg-[#F3F4F6] border-[#E5E7EB] cursor-not-allowed opacity-80" : "hover:border-[#D1D5DB]"}
            ${error ? "border-[#EF4444] bg-white" : isOpen ? "border-[#7C3AED] ring-2 ring-[#7C3AED]/10" : "border-[#E5E7EB]"}
            ${triggerClassName || ""}
          `}
        >
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            disabled={disabled}
            value={displayText}
            onFocus={() => !disabled && setIsOpen(true)}
            onChange={(e) => handleTypedChange(e.target.value)}
            placeholder={placeholder === "DD/MM/AAAA" ? maskPlaceholder : (placeholder || activePlaceholder)}
            className="flex-1 min-w-0 bg-transparent outline-none border-none text-[#1A1A2E] placeholder-[#9CA3AF] disabled:cursor-not-allowed text-[13px]"
          />
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange?.("");
                setDigits("");
              }}
              className="shrink-0 p-0.5 rounded-full text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#F3F4F6] transition-colors"
              title={t("Clear date")}
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          )}
          <button
            type="button"
            onClick={toggleDropdown}
            disabled={disabled}
            className="shrink-0 disabled:cursor-not-allowed"
            tabIndex={-1}
          >
            <Calendar
              className={`w-[16px] h-[16px] shrink-0 transition-colors duration-300 ${isOpen ? "text-[#7C3AED]" : "text-[#9CA3AF]"}`}
              strokeWidth={2.4}
            />
          </button>
        </div>
      )}

      {isOpen && (
        <div className={`absolute z-[100] top-[calc(100%+8px)] ${align === "right" ? "right-0" : "left-0"} bg-white border border-[#E5E7EB] rounded-[14px] shadow-[0_12px_36px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-100`}>
          {renderCalendar()}
        </div>
      )}
    </div>
  );
}
