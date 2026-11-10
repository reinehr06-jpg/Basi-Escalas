"use client";

import { useSidebar } from "@/context/SidebarContext";
import { Menu } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function MobileMenuButton() {
  const { isCollapsed, toggleSidebar, isMobile } = useSidebar();
  const { t } = useTranslation();

  if (!isMobile) return null;

  return (
    <button
      onClick={toggleSidebar}
      className="fixed bottom-4 left-4 z-[100] flex items-center justify-center w-10 h-10 rounded-lg bg-[#6D28D9] text-white shadow-lg hover:bg-[#5B21B6] transition-colors"
      aria-label={isCollapsed ? t("Abrir menu") : t("Fechar menu")}
    >
      <Menu size={22} strokeWidth={2.4} />
    </button>
  );
}
