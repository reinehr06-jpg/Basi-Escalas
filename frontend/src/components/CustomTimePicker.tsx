"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Clock } from "lucide-react";

interface CustomTimePickerProps {
  value?: string;
  onChange?: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function formatTimeDigits(digits: string) {
  let hh = digits.slice(0, 2);
  let mm = digits.slice(2, 4);
  if (hh.length === 2 && parseInt(hh, 10) > 23) hh = "23";
  if (mm.length === 2 && parseInt(mm, 10) > 59) mm = "59";
  if (digits.length <= 2) return hh;
  return `${hh}:${mm}`;
}

// Posições dos números no mostrador (12 marcas por anel)
function polarPoint(cx: number, cy: number, r: number, indexOf12: number) {
  const angle = (indexOf12 * 30 - 90) * (Math.PI / 180); // 12 na posição 0 (topo)
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

export default function CustomTimePicker({
  value = "",
  onChange,
  placeholder = "--:--",
  disabled = false,
  className = "",
  error = false,
}: CustomTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"hour" | "minute">("hour");
  const [digits, setDigits] = useState(() => value.replace(/\D/g, "").slice(0, 4));
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hourHeaderRef = useRef<HTMLInputElement>(null);
  const minuteHeaderRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const externalDigits = value ? value.replace(/\D/g, "").slice(0, 4) : "";
    setDigits((current) => (current === externalDigits ? current : externalDigits));
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setMode("hour");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hour = digits.length >= 2 ? parseInt(digits.slice(0, 2), 10) : null;
  const minute = digits.length >= 4 ? parseInt(digits.slice(2, 4), 10) : null;

  const handleTypedChange = (raw: string) => {
    const newDigits = raw.replace(/\D/g, "").slice(0, 4);
    setDigits(newDigits);
    if (newDigits.length === 4) {
      onChange?.(formatTimeDigits(newDigits));
    }
  };

  const commitHour = (h: number) => {
    const mm = digits.length >= 4 ? digits.slice(2, 4) : "00";
    const newDigits = `${String(h).padStart(2, "0")}${mm}`;
    setDigits(newDigits);
    setMode("minute");
    onChange?.(formatTimeDigits(newDigits));
  };

  const commitMinute = (m: number) => {
    const hh = digits.length >= 2 ? digits.slice(0, 2) : "00";
    const newDigits = `${hh}${String(m).padStart(2, "0")}`;
    setDigits(newDigits);
    onChange?.(formatTimeDigits(newDigits));
    setIsOpen(false);
    setMode("hour");
  };

  const toggleDropdown = () => {
    if (disabled) return;
    setMode("hour");
    setIsOpen((v) => !v);
  };

  const handleHourHeaderChange = (raw: string) => {
    let hh = raw.replace(/\D/g, "").slice(0, 2);
    if (hh.length === 2 && parseInt(hh, 10) > 23) hh = "23";
    const mm = digits.slice(2, 4);
    const newDigits = hh + mm;
    setDigits(newDigits);
    if (newDigits.length === 4) onChange?.(formatTimeDigits(newDigits));
    if (hh.length === 2) {
      setMode("minute");
      minuteHeaderRef.current?.focus();
      minuteHeaderRef.current?.select();
    }
  };

  const handleMinuteHeaderChange = (raw: string) => {
    let mm = raw.replace(/\D/g, "").slice(0, 2);
    if (mm.length === 2 && parseInt(mm, 10) > 59) mm = "59";
    const hh = digits.length >= 2 ? digits.slice(0, 2) : "";
    const newDigits = hh + mm;
    setDigits(newDigits);
    if (newDigits.length === 4) onChange?.(formatTimeDigits(newDigits));
  };

  const displayText = formatTimeDigits(digits);

  // ---------- Mostrador (clock face) ----------
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 82;
  const innerR = 52;

  const outerHours = Array.from({ length: 12 }, (_, i) => (i === 0 ? 0 : i)); // 0,1..11
  const innerHours = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i + 12)); // 12,13..23

  const selectedRing: "outer" | "inner" | null =
    hour === null ? null : hour >= 12 ? "inner" : "outer";
  const handAngleHour = hour === null ? null : ((hour % 12) * 30 - 90) * (Math.PI / 180);
  const handRadiusHour = selectedRing === "inner" ? innerR : outerR;

  const minuteMarks = Array.from({ length: 12 }, (_, i) => i * 5);
  const handAngleMinute = minute === null ? null : (minute * 6 - 90) * (Math.PI / 180);

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div
        className={`h-[38px] px-[12px] flex items-center gap-2 bg-white border rounded-[8px] transition-all
          ${disabled ? "bg-[#F3F4F6] border-[#E5E7EB] cursor-not-allowed opacity-80" : "hover:border-[#D1D5DB]"}
          ${error ? "border-[#EF4444]" : isOpen ? "border-[#D1D5DB]" : "border-[#E5E7EB]"}
        `}
      >
        <input
          type="text"
          inputMode="numeric"
          disabled={disabled}
          value={displayText}
          onFocus={() => !disabled && setIsOpen(true)}
          onChange={(e) => handleTypedChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 min-w-0 w-full bg-transparent outline-none border-none text-[13px] text-[#1A1A2E] placeholder-[#9CA3AF] disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={toggleDropdown}
          disabled={disabled}
          className="shrink-0 disabled:cursor-not-allowed"
          tabIndex={-1}
        >
          <Clock className={`w-[16px] h-[16px] transition-colors duration-300 ${isOpen ? "text-[#7C3AED]" : "text-[#9CA3AF]"}`} strokeWidth={2.4} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-[50] top-[calc(100%+4px)] right-0 bg-white border border-[#E5E7EB] rounded-[16px] shadow-[0_10px_30px_rgba(0,0,0,0.08)] overflow-hidden animate-in fade-in zoom-in-95 duration-100 w-[260px]">
          {/* Cabeçalho: HH : MM — digitável e clicável para trocar de modo */}
          <div className="flex items-center justify-center gap-[6px] py-[14px] bg-[#F9F7FF] border-b border-[#F1F1F4]">
            <input
              ref={hourHeaderRef}
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={hour !== null ? String(hour).padStart(2, "0") : ""}
              placeholder="--"
              onFocus={(e) => { setMode("hour"); e.target.select(); }}
              onChange={(e) => handleHourHeaderChange(e.target.value)}
              className={`w-[52px] text-center text-[28px] font-[800] px-[6px] py-[2px] rounded-[6px] outline-none transition-colors ${mode === "hour" ? "text-[#7C3AED] bg-[#F4EEFF]" : "text-[#9CA3AF] hover:text-[#4B5563]"}`}
            />
            <span className="text-[28px] font-[800] text-[#9CA3AF]">:</span>
            <input
              ref={minuteHeaderRef}
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={minute !== null ? String(minute).padStart(2, "0") : ""}
              placeholder="--"
              onFocus={(e) => { setMode("minute"); e.target.select(); }}
              onChange={(e) => handleMinuteHeaderChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !e.currentTarget.value) {
                  hourHeaderRef.current?.focus();
                  hourHeaderRef.current?.select();
                }
              }}
              className={`w-[52px] text-center text-[28px] font-[800] px-[6px] py-[2px] rounded-[6px] outline-none transition-colors ${mode === "minute" ? "text-[#7C3AED] bg-[#F4EEFF]" : "text-[#9CA3AF] hover:text-[#4B5563]"}`}
            />
          </div>

          {/* Mostrador */}
          <div className="p-[16px] flex items-center justify-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <circle cx={cx} cy={cy} r={outerR + 18} fill="#FCFCFD" stroke="#F1F1F4" strokeWidth={1} />

              {mode === "hour" ? (
                <>
                  {/* Ponteiro */}
                  {handAngleHour !== null && (
                    <line
                      x1={cx}
                      y1={cy}
                      x2={cx + handRadiusHour * Math.cos(handAngleHour)}
                      y2={cy + handRadiusHour * Math.sin(handAngleHour)}
                      stroke="#7C3AED"
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  )}
                  {/* Anel externo 0-11 */}
                  {outerHours.map((h) => {
                    const idx = h === 0 ? 0 : h;
                    const { x, y } = polarPoint(cx, cy, outerR, idx);
                    const isSel = hour === h;
                    return (
                      <g key={`o-${h}`} onClick={() => commitHour(h)} className="cursor-pointer">
                        <circle cx={x} cy={y} r={14} fill={isSel ? "#7C3AED" : "transparent"} />
                        <text x={x} y={y + 4} textAnchor="middle" fontSize={12} fontWeight={isSel ? 700 : 500} fill={isSel ? "#fff" : "#374151"}>
                          {String(h).padStart(2, "0")}
                        </text>
                      </g>
                    );
                  })}
                  {/* Anel interno 12-23 */}
                  {innerHours.map((h, i) => {
                    const { x, y } = polarPoint(cx, cy, innerR, i);
                    const isSel = hour === h;
                    return (
                      <g key={`i-${h}`} onClick={() => commitHour(h)} className="cursor-pointer">
                        <circle cx={x} cy={y} r={12} fill={isSel ? "#7C3AED" : "transparent"} />
                        <text x={x} y={y + 3.5} textAnchor="middle" fontSize={10.5} fontWeight={isSel ? 700 : 500} fill={isSel ? "#fff" : "#6B7280"}>
                          {h}
                        </text>
                      </g>
                    );
                  })}
                </>
              ) : (
                <>
                  {handAngleMinute !== null && (
                    <line
                      x1={cx}
                      y1={cy}
                      x2={cx + outerR * Math.cos(handAngleMinute)}
                      y2={cy + outerR * Math.sin(handAngleMinute)}
                      stroke="#7C3AED"
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  )}
                  {minuteMarks.map((m, i) => {
                    const { x, y } = polarPoint(cx, cy, outerR, i);
                    const isSel = minute === m;
                    return (
                      <g key={`m-${m}`} onClick={() => commitMinute(m)} className="cursor-pointer">
                        <circle cx={x} cy={y} r={14} fill={isSel ? "#7C3AED" : "transparent"} />
                        <text x={x} y={y + 4} textAnchor="middle" fontSize={12} fontWeight={isSel ? 700 : 500} fill={isSel ? "#fff" : "#374151"}>
                          {String(m).padStart(2, "0")}
                        </text>
                      </g>
                    );
                  })}
                </>
              )}

              {/* Pino central com a logo oficial da Basiléia (mesmo arquivo usado no menu/sidebar) */}
              <circle cx={cx} cy={cy} r={13} fill="#6D28D9" />
              <foreignObject x={cx - 11} y={cy - 11} width={22} height={22}>
                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                  <img
                    src="https://dash.basileia.global/images/logo-basileia.png?0b669f9a5d54a07b37941d0c8db9ac64"
                    alt="Basiléia"
                    className="w-[18px] h-auto object-contain"
                    style={{ filter: "brightness(0) invert(1)" }}
                  />
                </div>
              </foreignObject>
            </svg>
          </div>

          <div className="px-[16px] pb-[14px] flex items-center justify-between">
            <span className="text-[11px] text-[#9CA3AF]">{mode === "hour" ? "Selecione a hora" : "Selecione o minuto"}</span>
            <button
              type="button"
              onClick={() => { setIsOpen(false); setMode("hour"); }}
              className="text-[12px] font-[600] text-[#7C3AED] hover:underline"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
