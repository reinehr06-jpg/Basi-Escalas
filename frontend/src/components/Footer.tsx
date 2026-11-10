"use client";

import React from "react";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <div className="w-full mt-auto py-[16px] px-[24px] bg-transparent flex flex-col sm:flex-row items-center justify-center gap-2 shrink-0">
      <p className="text-[13px] text-[#6B7280] text-center">
        {t("COPYRIGHT © 2026")} <span className="font-[700] text-[#6D28D9]">{t("Basileia")}</span>{t(", All rights reserved")}
      </p>
    </div>
  );
}
