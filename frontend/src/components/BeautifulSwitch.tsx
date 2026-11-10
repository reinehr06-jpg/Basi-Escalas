"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";

interface BeautifulSwitchProps {
  checked: boolean;
  onChange: () => void;
}

export default function BeautifulSwitch({ checked, onChange }: BeautifulSwitchProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-semibold w-7.5 text-right transition-colors ${checked ? 'text-violet-600' : 'text-gray-400'}`}>
        {checked ? t('YES') : t('NO')}
      </span>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
          checked ? 'bg-violet-600' : 'bg-gray-200'
        }`}
      >
        <span className="sr-only">{t("Toggle presence")}</span>
        <span
          className={`pointer-events-none flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-300 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        >
          {checked && <Check className="w-3 h-3 text-violet-600" strokeWidth={3} />}
        </span>
      </button>
    </div>
  );
}
