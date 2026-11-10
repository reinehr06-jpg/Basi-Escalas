"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, X, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface SelectOption {
  value: string;
  label: string;
  group?: string;
  badge?: string;
  badgeColor?: "purple" | "green" | "blue" | "gray" | "amber";
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  options: SelectOption[];
  value?: string | string[]; // string for single, string[] for multiple
  onChange?: (value: any) => void;
  placeholder?: string;
  disabled?: boolean;
  multiple?: boolean;
  searchable?: boolean;
  className?: string;
  triggerClassName?: string; // classes adicionais para o div gatilho (ex: altura compacta)
  placement?: "top" | "bottom"; // define se o dropdown abre para baixo ou para cima
  compact?: boolean; // modo compacto para paginação
  onSearchChange?: (term: string) => void; // evento disparado ao digitar na busca
  error?: boolean;
  isClearable?: boolean;
}

export default function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = "Selecione",
  disabled = false,
  multiple = false,
  searchable = false,
  className = "",
  triggerClassName = "",
  placement = "bottom",
  compact = false,
  onSearchChange,
  error = false,
  isClearable = false,
}: CustomSelectProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        (!portalRef.current || !portalRef.current.contains(target))
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fecha o dropdown ao scrollar para não descolar do input
  useEffect(() => {
    const handleScroll = (e: Event) => {
      // Ignora scroll dentro do próprio dropdown
      if (portalRef.current && portalRef.current.contains(e.target as Node)) return;
      if (isOpen) setIsOpen(false);
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [isOpen]);

  // Foca no input de busca ao abrir e ajusta a posição
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownMaxHeight = 280; // altura máxima estimada do dropdown
      
      // Abre para cima se não houver espaço embaixo E houver mais espaço em cima, OU se a prop placement for explicitamente 'top'
      const shouldOpenUpwards = placement === "top" || (spaceBelow < dropdownMaxHeight && spaceAbove > spaceBelow);

      setDropdownStyle({
        position: "fixed",
        top: shouldOpenUpwards ? undefined : rect.bottom + 4,
        bottom: shouldOpenUpwards ? window.innerHeight - rect.top + 4 : undefined,
        left: rect.left,
        width: rect.width,
      });
    }
    if (!isOpen) {
      setSearchTerm("");
      onSearchChange?.("");
    }
  }, [isOpen, searchable, placement]);

  const toggleDropdown = () => {
    if (!disabled) setIsOpen(!isOpen);
  };

  const clearValue = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(multiple ? [] : "");
  };

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const currentValue = Array.isArray(value) ? value : [];
      if (currentValue.includes(optionValue)) {
        onChange?.(currentValue.filter((v) => v !== optionValue));
      } else {
        onChange?.([...currentValue, optionValue]);
      }
    } else {
      onChange?.(optionValue);
      setIsOpen(false);
    }
  };

  const extractPrimitiveId = (val: any): string => {
    if (val === null || val === undefined) return "";
    if (typeof val === "string" || typeof val === "number") return String(val);
    if (typeof val === "object") {
      return String(val.value || val.id_member || val._id || val.id || "");
    }
    return "";
  };

  const extractDisplayLabel = (val: any): string => {
    if (val === null || val === undefined) return "";
    if (typeof val === "string" || typeof val === "number") return String(val);
    if (typeof val === "object") {
      return String(
        val.label ||
        val.fullname ||
        val.name ||
        val.title ||
        val.description ||
        val.value ||
        val.id_member ||
        val.id ||
        val._id ||
        ""
      );
    }
    return "";
  };

  const removeValue = (optionValueToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple && Array.isArray(value)) {
      onChange?.(value.filter((v) => extractPrimitiveId(v) !== optionValueToRemove && v !== optionValueToRemove));
    }
  };

  const normalizeStr = (str: any) => {
    return String(str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const renderBadge = (badge?: string, badgeColor?: string) => {
    if (!badge) return null;
    const colorMap: Record<string, string> = {
      purple: "bg-[#F4EEFF] text-[#7C3AED] border-[#DDD6FE]",
      green: "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]",
      blue: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
      amber: "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]",
      gray: "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]",
    };
    const colorClasses = colorMap[badgeColor || "gray"] || colorMap.gray;
    return (
      <span
        className={`inline-flex items-center text-[10px] font-[600] px-1.5 py-0.5 rounded-full border shrink-0 tracking-tight leading-none ${colorClasses}`}
      >
        {badge}
      </span>
    );
  };

  const filteredOptions = onSearchChange 
    ? options 
    : options.filter((opt) =>
        normalizeStr(opt?.label).includes(normalizeStr(searchTerm)) ||
        (opt?.group && normalizeStr(opt.group).includes(normalizeStr(searchTerm))) ||
        (opt?.badge && normalizeStr(opt.badge).includes(normalizeStr(searchTerm)))
      );

  const [cachedLabels, setCachedLabels] = useState<Record<string, string>>({});

  // Caches labels so async searches don't lose the label of a selected item when options refresh
  useEffect(() => {
    setCachedLabels((prev) => {
      const next = { ...prev };
      options.forEach((opt) => {
        if (opt.value && opt.label) {
          next[opt.value] = typeof opt.label === "string" ? opt.label : extractDisplayLabel(opt.label);
        }
      });
      return next;
    });
  }, [options]);

  // Renderização do valor selecionado
  const renderValue = () => {
    if (multiple) {
      const selectedOptions = Array.isArray(value) ? value : [];
      if (selectedOptions.length === 0) {
        return <span className="text-[#9CA3AF] truncate">{placeholder}</span>;
      }
      return (
        <div className="flex flex-wrap gap-1.5 overflow-hidden">
          {selectedOptions.map((rawVal, idx) => {
            const valId = extractPrimitiveId(rawVal) || String(idx);
            const opt = options.find((o) => o.value === valId || o.value === rawVal);
            const rawLabel = opt?.label || (typeof rawVal === "string" ? cachedLabels[rawVal] : undefined) || extractDisplayLabel(rawVal) || valId;
            const displayLabel = extractDisplayLabel(rawLabel);
            return (
              <span
                key={valId || idx}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#F3F4F6] text-[#374151] text-[12px] font-medium rounded-[4px] border border-[#D1D5DB] max-w-[120px]"
              >
                <span className="truncate">{displayLabel}</span>
                <X
                  className="w-3 h-3 hover:text-[#111827] cursor-pointer shrink-0"
                  onClick={(e) => removeValue(valId, e)}
                  strokeWidth={2.5}
                />
              </span>
            );
          })}
        </div>
      );
    } else {
      if (!value) return <span className="text-[#9CA3AF] truncate">{placeholder}</span>;
      const valId = extractPrimitiveId(value);
      const selectedOption = options.find((o) => o.value === value || (Boolean(valId) && o.value === valId));
      const rawLabel = selectedOption?.label || (typeof value === "string" ? cachedLabels[value] : undefined) || extractDisplayLabel(value) || valId;
      const displayLabel = extractDisplayLabel(rawLabel);
      return (
        <div className="flex items-center gap-2 truncate">
          <span className={`${disabled ? "text-[#9CA3AF]" : "text-[#1A1A2E]"} truncate`}>{displayLabel}</span>
          {renderBadge(selectedOption?.badge, selectedOption?.badgeColor)}
        </div>
      );
    }
  };

  const isSelected = (val: string) => {
    if (multiple && Array.isArray(value)) {
      return value.some((v) => v === val || extractPrimitiveId(v) === val);
    }
    return value === val || (Boolean(val) && extractPrimitiveId(value) === val);
  };

  return (
    <div className={`relative ${className || "w-full"}`} ref={dropdownRef}>
      <div
        onClick={toggleDropdown}
        className={`min-h-[40px] px-[12px] flex items-center justify-between border rounded-[8px] transition-all cursor-pointer select-none
          ${disabled ? "bg-[#F3F4F6] border-[#E5E7EB] cursor-not-allowed opacity-80 text-[#9CA3AF]" : "bg-white hover:border-[#D1D5DB]"}
          ${error ? "border-[#EF4444] bg-white" : isOpen ? "border-[#D1D5DB]" : "border-[#E5E7EB]"}
          ${triggerClassName}
        `}
      >
        <div className="flex-1 overflow-hidden pr-2">{renderValue()}</div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isClearable && (!multiple ? value : (value && value.length > 0)) && (
            <div 
              onClick={clearValue}
              className="p-0.5 rounded-full hover:bg-[#F3F4F6] text-[#9CA3AF] hover:text-[#EF4444] transition-colors"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
            </div>
          )}
          <ChevronDown
            className={`w-[16px] h-[16px] text-[#9CA3AF] transition-transform duration-300 ${isOpen ? "rotate-180 text-[#111827]" : ""}`}
            strokeWidth={2.4}
          />
        </div>
      </div>

      {isOpen && typeof document !== "undefined" && createPortal(
        <div 
          ref={portalRef}
          style={dropdownStyle}
          className={`z-[9999] bg-white border border-[#E5E7EB] rounded-[10px] shadow-[0_10px_30px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in zoom-in-95 duration-100`}
        >
          
          {searchable && (
            <div className="p-2 border-b border-[#F1F1F4] bg-[#F9FAFB]/50">
              <div className="relative flex items-center bg-white border border-[#E5E7EB] rounded-[6px] px-2.5 h-[32px]  transition-colors">
                <Search className="w-3.5 h-3.5 text-[#9CA3AF] mr-2 shrink-0" strokeWidth={2.5} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t("Search...")}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    onSearchChange?.(e.target.value);
                  }}
                  className="bg-transparent border-none outline-none text-[13px] text-[#374151] w-full"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          <div className="max-h-[280px] overflow-y-auto p-1 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-[13px] text-[#6B7280]">
                {t("No results found")}
              </div>
            ) : (
              (() => {
                let currentGroup: string | undefined = undefined;
                return filteredOptions.map((opt, idx) => {
                  const showGroupHeader = Boolean(opt.group && opt.group !== currentGroup);
                  if (opt.group) {
                    currentGroup = opt.group;
                  }
                  const selected = isSelected(opt.value);

                  return (
                    <React.Fragment key={opt.value || idx}>
                      {showGroupHeader && (
                        <div
                          className={`px-3 py-1.5 text-[10px] font-[700] uppercase tracking-wider text-[#9CA3AF] flex items-center justify-between select-none ${
                            idx > 0 ? "mt-2 pt-2 border-t border-[#F1F1F4]" : "pt-1"
                          }`}
                        >
                          <span>{opt.group}</span>
                        </div>
                      )}
                      <div
                        onClick={() => handleSelect(opt.value)}
                        className={`flex items-center justify-between px-3 ${
                          compact ? "py-1.5 text-[12px]" : "py-2 text-[13px]"
                        } rounded-[6px] cursor-pointer transition-colors ${
                          selected
                            ? "bg-[#F4EEFF] text-[#6D28D9] font-semibold"
                            : "text-[#374151] hover:bg-[#F9FAFB]"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className="truncate">{opt.label}</span>
                          {renderBadge(opt.badge, opt.badgeColor)}
                        </div>
                        {selected && (
                          <Check className="w-4 h-4 shrink-0 text-[#6D28D9]" strokeWidth={2.5} />
                        )}
                      </div>
                    </React.Fragment>
                  );
                });
              })()
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
