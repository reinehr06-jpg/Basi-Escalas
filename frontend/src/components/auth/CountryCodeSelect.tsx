import React, { useState, useEffect, useRef } from "react";
import { countryCodes } from "@/data/country-codes";

interface CountryCodeSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function CountryCodeSelect({ value, onChange }: CountryCodeSelectProps) {
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

  const selectedCountry = countryCodes.find((c) => c.value === value);

  return (
    <div className="ddi-picker" ref={ddiRef}>
      <div
        className={`ddi-trigger${open ? " open" : ""}`}
        onClick={() => setOpen(!open)}
      >
        <span>{selectedCountry?.label || "🇧🇷 +55"}</span>
        <svg
          className="ddi-chevron"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      {open && (
        <div className="ddi-dropdown">
          <div className="ddi-search-wrap">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              placeholder="Pesquisar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="ddi-list">
            {countryCodes
              .filter((c) =>
                c.label.toLowerCase().includes(search.toLowerCase())
              )
              .map((c) => (
                <div
                  key={c.value}
                  className={`ddi-option${
                    c.value === value ? " selected" : ""
                  }`}
                  onClick={() => {
                    onChange(c.value);
                    setOpen(false);
                  }}
                >
                  <span>{c.label}</span>
                  {c.value === value && (
                    <svg
                      width="14"
                      height="14"
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
