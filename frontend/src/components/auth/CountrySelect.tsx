import React, { useState, useEffect, useRef } from "react";
import { countriesList } from "@/data/countries";
import { useTranslation } from "react-i18next";

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function CountrySelect({ value, onChange }: CountrySelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ddiRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ddiRef.current && !ddiRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    if (!open) {
      setSearch("");
    }
  }, [open]);

  useEffect(() => {
    if (!value) {
      const browserLang = navigator.language || "pt-BR";
      const code = browserLang.split("-")[1] || browserLang.toUpperCase();
      const found = countriesList.find(c => c.value === code);
      if (found) {
        onChange(found.value);
      } else {
        onChange("BR");
      }
    }
  }, [value, onChange]);

  const selectedCountry = countriesList.find(c => c.value === value);

  return (
    <div className="ddi-picker" ref={ddiRef} style={{ width: "100%", position: "relative" }}>
      <div
        className={`ddi-trigger${open ? " open" : ""}`}
        onClick={() => setOpen(!open)}
        style={{ 
          width: "100%", 
          height: "50px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          border: open ? "1px solid #7C3AED" : "1px solid #E5E7EB", 
          boxShadow: open ? "0 0 0 3px rgba(124, 58, 237, 0.15)" : "none",
          borderRadius: "12px", 
          background: "#fff", 
          padding: "0 16px",
          cursor: "pointer",
          transition: "border-color 200ms, box-shadow 200ms"
        }}
      >
        <span style={{ fontSize: "14px", color: "#111827", fontWeight: 400 }}>
          {selectedCountry ? t(selectedCountry.label) : t("Select...")}
        </span>
        <svg
          className="ddi-chevron"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9CA3AF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: "transform 200ms", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      {open && (
        <div 
          className="ddi-dropdown" 
          style={{ 
            width: "100%", 
            position: "absolute", 
            zIndex: 100, 
            top: "calc(100% + 4px)", 
            left: 0,
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: "12px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            overflow: "hidden"
          }}
        >
          <div className="ddi-search-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderBottom: '1px solid #F3F4F6' }}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9CA3AF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: '16px', height: '16px' }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              placeholder={t("Search country...") as string}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: '#374151', height: 'auto' }}
            />
          </div>
          <div className="ddi-list" style={{ maxHeight: '220px', overflowY: 'auto', padding: '4px' }}>
            {countriesList
              .filter((c) =>
                t(c.label).toLowerCase().includes(search.toLowerCase())
              )
              .map((c) => (
                <div
                  key={c.value}
                  className={`ddi-option${
                    c.value === value ? " selected" : ""
                  }`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
                    background: c.value === value ? '#F4EEFF' : 'transparent',
                    color: c.value === value ? '#6D28D9' : '#374151',
                    fontWeight: c.value === value ? 500 : 400
                  }}
                  onMouseEnter={(e) => { if (c.value !== value) e.currentTarget.style.background = '#F9FAFB'; }}
                  onMouseLeave={(e) => { if (c.value !== value) e.currentTarget.style.background = 'transparent'; }}
                  onClick={() => {
                    onChange(c.value);
                    setOpen(false);
                  }}
                >
                  <span>{t(c.label)}</span>
                  {c.value === value && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#7C3AED"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
