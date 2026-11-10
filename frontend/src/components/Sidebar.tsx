"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  SquarePen,
  UsersRound,
  CalendarDays,
  GraduationCap,
  HeartHandshake,
  ShieldPlus,
  Bot,
  Settings,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  HelpCircle,
  LogOut,
  Menu,
} from "lucide-react";
import { navSections, getFilteredNavSections } from "@/data/navigation";
import { ROLE_LABELS } from "@/lib/escalas-format";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar({ isInactive = false }: { isInactive?: boolean }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();

  /**
   * INTEGRAÇÃO BACKEND:
   * isCollapsed: Pode salvar essa preferência de UX no localStorage ou no banco do usuário.
   */
  const [isCollapsed, setIsCollapsed] = useState(false);

  /**
   * COMPORTAMENTO RESPONSIVO:
   * Abaixo de 1024px a sidebar vira um drawer que começa fechado
   * (translate-x-full) e é aberto pelo botão flutuante de menu.
   */
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = typeof window !== "undefined" && window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsCollapsed(true);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  /**
   * INTEGRAÇÃO BACKEND:
   * activeItem: Sincronizado automaticamente com a rota atual (pathname).
   */
  const [activeItem, setActiveItem] = useState("");

  /**
   * INTEGRAÇÃO BACKEND:
   * openSubmenus: Controla os accordions. Para o modo "Exclusivo" (apenas 1 aberto), 
   * é preenchido com array de 1 string.
   */
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sincroniza o menu lateral com a URL atual (Next.js App Router)
    if (pathname === '/dashboard') {
      setActiveItem('Dashboard');
    } else if (pathname.includes('/branches')) {
      setActiveItem('Branches');
    } else if (pathname.includes('/ai_configs/profile')) {
      setActiveItem('Assistant Profile');
      if (!openSubmenus.includes('Virtual Assistant')) setOpenSubmenus(['Virtual Assistant']);
    } else if (pathname.includes('/ai_configs/notifications')) {
      setActiveItem('Notification Types');
      if (!openSubmenus.includes('Virtual Assistant')) setOpenSubmenus(['Virtual Assistant']);
    } else if (pathname.includes('/cults/schedule')) {
      setActiveItem('Service Schedule');
      if (!openSubmenus.includes('Services')) setOpenSubmenus(['Services']);
    } else if (pathname.includes('/cults/attendance')) {
      setActiveItem('Attendance Record');
      if (!openSubmenus.includes('Services')) setOpenSubmenus(['Services']);
    } else if (pathname.includes('/acceptedJesus')) {
      setActiveItem('Accepted Jesus');
      if (!openSubmenus.includes('Care')) setOpenSubmenus(['Care']);
    } else if (pathname.includes('/registers/networks')) {
      setActiveItem('Networks');
      if (!openSubmenus.includes('Registrations')) setOpenSubmenus(['Registrations']);
    } else if (pathname.includes('/registers/visitors')) {
      setActiveItem('Visitors');
      if (!openSubmenus.includes('Registrations')) setOpenSubmenus(['Registrations']);
    } else if (pathname.includes('/registers/ministries')) {
      setActiveItem('Ministries');
      if (!openSubmenus.includes('Registrations')) setOpenSubmenus(['Registrations']);
    } else if (pathname.includes('/registers/positions')) {
      setActiveItem('Positions');
      if (!openSubmenus.includes('Registrations')) setOpenSubmenus(['Registrations']);
    } else if (pathname.includes('/registers/members')) {
      setActiveItem('Members');
      if (!openSubmenus.includes('Registrations')) setOpenSubmenus(['Registrations']);
    } else if (pathname.includes('/cells/attendance')) {
      setActiveItem('Attendance Record');
      if (!openSubmenus.includes('Cells')) setOpenSubmenus(['Cells']);
    } else if (pathname.includes('/cells/register')) {
      setActiveItem('Cell Management');
      if (!openSubmenus.includes('Cells')) setOpenSubmenus(['Cells']);
    } else if (pathname.includes('/cells/metrics/new')) {
      setActiveItem('Cell Management');
      if (!openSubmenus.includes('Cells')) setOpenSubmenus(['Cells']);
    } else if (pathname.includes('/cells/profiles')) {
      setActiveItem('Profile');
      if (!openSubmenus.includes('Cells')) setOpenSubmenus(['Cells']);
    } else if (pathname.includes('/cells/metrics')) {
      setActiveItem('Cell Metrics');
      if (!openSubmenus.includes('Cells')) setOpenSubmenus(['Cells']);
    } else if (pathname.includes('/solicitations')) {
      setActiveItem('Pastoral Care');
      if (!openSubmenus.includes('Care')) setOpenSubmenus(['Care']);
    } else if (pathname.includes('/calendar')) {
      setActiveItem('Calendar');
    } else if (pathname.includes('/courses')) {
      setActiveItem('Courses');
    } else if (pathname.includes('/events')) {
      setActiveItem('Events');
    } else if (pathname.includes('/systemUsers')) {
      setActiveItem('Users');
    } else if (pathname.includes('/settings') || pathname.includes('/qr-codes')) {
      setActiveItem('Settings');
    } else if (pathname.includes('/api-docs') || pathname.includes('/docs')) {
      setActiveItem('API Documentation');
    }
  }, [pathname]);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const toggleSubmenu = (item: string) => {
    setOpenSubmenus(prev =>
      prev.includes(item) ? [] : [item]
    );
  };

  // navSections e getFilteredNavSections importados de @/data/navigation.ts
  let filteredNavSections = isInactive
    ? [{
        title: "SETTINGS",
        items: [
          { label: "Settings", icon: Settings, href: "/settings" }
        ]
      }]
    : getFilteredNavSections(user?.role || "");

  const sidebarGradient = "linear-gradient(180deg, #14043E 0%, #0F0538 45%, #180B47 100%)";
  const activeGradient = "var(--color-active-item)";

  return (
    <>
      {/* Backdrop escurecido atrás do drawer em mobile */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-[55] transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Botão flutuante para abrir/fechar o menu em mobile */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed bottom-4 left-4 z-[100] flex items-center justify-center w-10 h-10 rounded-lg bg-[#6D28D9] text-white shadow-lg hover:bg-[#5B21B6] transition-colors"
          aria-label={isCollapsed ? t("Abrir menu") : t("Fechar menu")}
        >
          <Menu size={22} strokeWidth={2.4} />
        </button>
      )}

      <aside
        className={`fixed left-0 top-0 h-dvh flex flex-col custom-scrollbar transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-[60] ${isMobile
          ? isCollapsed
            ? "-translate-x-full w-[240px]"
            : "translate-x-0 w-[240px]"
          : isCollapsed
            ? "w-[72px]"
            : "w-[240px] 2xl:w-[320px]"
          }`}
        style={{
          background: sidebarGradient,
          fontFamily: "var(--font-inter)",
        }}
      >
        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col w-full">
            {/* TOPO */}
            <div className="flex items-center justify-between px-3 pt-6 pb-4 relative h-20">
              <Link
                href="/dashboard"
                className="flex flex-col overflow-hidden hover:opacity-80 transition-opacity"
                onClick={() => { if (isMobile) setIsCollapsed(true); }}
              >
                <img
                  src="https://dash.basileia.global/images/logo-basileia.png?0b669f9a5d54a07b37941d0c8db9ac64"
                  alt="Basileia"
                  className={`flex-shrink-0 ml-1 transition-all duration-300 ${isCollapsed ? "w-8" : "w-[130px]"
                    }`}
                  style={{ height: 'auto', filter: 'brightness(0) invert(1)' }}
                />
                {/* INTEGRAÇÃO BACKEND: Nome do sistema ativo — futuro: vir do contexto/tenant */}
                <span
                  className={`ml-[38px] mt-[-2px] font-[500] text-[12px] tracking-[0.02em] text-text-muted leading-tight transition-all duration-300 ${isCollapsed ? "opacity-0 h-0" : "opacity-100"
                    }`}
                >
                  {t("Scheduling")}
                </span>
              </Link>

              <button
                onClick={toggleSidebar}
                className="absolute right-3 flex items-center justify-center w-7 h-7 rounded-full border border-purple-border text-text-secondary hover:bg-item-hover transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRight size={16} strokeWidth={2.4} />
                ) : (
                  <ChevronLeft size={16} strokeWidth={2.4} />
                )}
              </button>
            </div>

            <div className="flex flex-col px-3 gap-4 mt-2 pb-4">
              {filteredNavSections.map((section, idx) => (
                <div key={idx} className="flex flex-col gap-1 w-full">
                  <div
                    className={`flex items-center gap-2 mb-1 whitespace-nowrap transition-all duration-300 overflow-hidden ${isCollapsed ? "opacity-0 h-0" : "opacity-100 h-auto px-2"
                      }`}
                  >
                    <span className="text-[10px] font-[700] text-text-section uppercase tracking-[0.12em]">
                      {t(section.title)}
                    </span>
                    <div className="flex-grow h-px bg-divider flex items-center justify-end">
                      <div className="w-1 h-1 rounded-full bg-divider-dot"></div>
                    </div>
                  </div>

                  {section.items.map((item, itemIdx) => {
                    const isActive = activeItem === item.label && !('isAccordion' in item && item.isAccordion);
                    const isAccordionOpen = openSubmenus.includes(item.label);

                    return (
                      <div key={itemIdx} className="flex flex-col w-full">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            if ('isAccordion' in item && item.isAccordion) toggleSubmenu(item.label);
                            else {
                              setActiveItem(item.label);
                              if ((item as any).href) {
                                router.push((item as any).href);
                                if (isMobile) setIsCollapsed(true);
                              }
                            }
                          }}
                          title={isCollapsed ? item.label : ""}
                          className="group flex items-center w-full px-[10px] py-[8px] rounded-[8px] cursor-pointer transition-all duration-200"
                          style={{
                            background: isActive ? activeGradient : "transparent",
                          }}
                        >
                          <div className="flex-shrink-0 flex items-center justify-center w-6 h-6">
                            <item.icon
                              size={20}
                              strokeWidth={2}
                              className="text-[#F8F7FF]"
                            />
                          </div>

                          <div
                            className={`flex items-center justify-between flex-grow whitespace-nowrap transition-all duration-300 overflow-hidden ${isCollapsed ? "opacity-0 w-0 ml-0" : "opacity-100 w-auto ml-2"
                              }`}
                          >
                            <span className="font-[600] text-[13px] text-text-primary">
                              {t(item.label)}
                            </span>

                            {('isAccordion' in item && item.isAccordion) && (
                              <ChevronRight
                                size={16}
                                strokeWidth={2.4}
                                className={`text-text-secondary transition-transform duration-300 ${isAccordionOpen ? "rotate-90" : "rotate-0"
                                  }`}
                              />
                            )}
                          </div>
                        </button>

                        {('isAccordion' in item && item.isAccordion && 'subItems' in item && item.subItems) && (
                          <div
                            className={`flex flex-col w-full overflow-hidden transition-all duration-300 ${isAccordionOpen && !isCollapsed ? "max-h-[500px] mt-1" : "max-h-0"
                              }`}
                          >
                            {/* Linha vertical de conexão */}
                            <div className="relative pl-[26px] pr-2 flex flex-col gap-1 w-full">
                              <div className="absolute left-[26px] top-0 bottom-4 w-px bg-divider"></div>

                              {(item as any).subItems.map((subItem: any, subIdx: number) => {
                                const isActiveSubItem = subItem.href
                                  ? (pathname === subItem.href || (subItem.href !== '/' && pathname.startsWith(subItem.href + '/')))
                                  : activeItem === subItem.label;

                                const content = (
                                  <>
                                    {/* Bolinha do Submenu */}
                                    <div
                                      className={`absolute left-0 w-[4px] h-[4px] rounded-full -ml-[18px] top-1/2 -translate-y-1/2 ${isActiveSubItem ? "bg-white" : "bg-text-muted"
                                        }`}
                                    ></div>

                                    <span
                                      className={`font-[500] text-[12px] ${isActiveSubItem ? "text-text-primary" : "text-text-secondary"
                                        }`}
                                    >
                                      {t(subItem.label)}
                                    </span>
                                  </>
                                );

                                const className = `relative flex items-center px-3 py-1.5 w-full rounded-[8px] cursor-pointer transition-all duration-200 ${isActiveSubItem ? "ml-4" : "ml-4 hover:bg-item-hover"
                                  }`;
                                const style = {
                                  background: isActiveSubItem ? activeGradient : "transparent",
                                };

                                if ("href" in subItem) {
                                  return (
                                    <Link
                                      key={subIdx}
                                      href={subItem.href as string}
                                      className={className}
                                      style={style}
                                      onClick={() => { if (isMobile) setIsCollapsed(true); }}
                                    >
                                      {content}
                                    </Link>
                                  );
                                }

                                return (
                                  <button
                                    type="button"
                                    key={subIdx}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setActiveItem(subItem.label);
                                      if (isMobile) setIsCollapsed(true);
                                    }}
                                    className={className}
                                    style={style}
                                  >
                                    {content}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer — card do usuário logado com dropdown */}
        <div className="px-2 pb-2 relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={`flex items-center justify-between p-2.5 rounded-[12px] border border-user-card-border bg-user-card-bg cursor-pointer hover:bg-white/10 transition-colors w-full overflow-hidden ${userMenuOpen ? "bg-white/10" : ""
              }`}
          >
            <div className="flex items-center gap-2 w-full">
              <div className="relative flex-shrink-0 w-8 h-8 rounded-full bg-gray-500 overflow-hidden">
                <img src="https://i.pravatar.cc/100?img=11" alt="Avatar" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 right-0 w-[8px] h-[8px] bg-online-green rounded-full border-[1px] border-[#0F0538]"></div>
              </div>

              <div
                className={`flex flex-col items-start whitespace-nowrap transition-all duration-300 overflow-hidden flex-grow ${isCollapsed ? "opacity-0 w-0" : "opacity-100"
                  }`}
              >
                <span className="font-[600] text-[13px] text-text-primary leading-tight mb-[2px]">
                  {user?.name || t("User")}
                </span>
                <span className="font-[500] text-[11px] text-text-muted leading-tight">
                  {ROLE_LABELS[user?.role ?? ""] ?? t("User")}
                </span>
              </div>

              <div
                className={`flex-shrink-0 transition-transform duration-300 ${isCollapsed ? "opacity-0 w-0" : "opacity-100"
                  }`}
              >
                <ChevronDown
                  size={16}
                  strokeWidth={2.4}
                  className={`text-text-secondary transition-transform duration-300 ${userMenuOpen ? "rotate-180" : ""
                    }`}
                />
              </div>
            </div>
          </button>

          {/* Dropdown backdrop */}
          {userMenuOpen && !isCollapsed && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setUserMenuOpen(false)}
            />
          )}

          {/* Dropdown menu */}
          {userMenuOpen && !isCollapsed && (
            <div
              ref={userMenuRef}
              className="fixed bottom-[76px] left-2 z-50 w-[224px]"
              style={{ pointerEvents: "auto" }}
            >
              <div className="rounded-[12px] border border-user-card-border bg-[#1a0d3e] backdrop-blur-sm overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                {/* INTEGRAÇÃO BACKEND: Ajuda — direciona para o canal do YouTube Basileia Global */}
                {/* TODO: Quando tiver base de conhecimento própria, trocar href para a URL do help center */}
                <a
                  href="https://www.youtube.com/@BasileiaGlobal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 transition-colors text-text-primary text-[13px] font-[500]"
                >
                  <HelpCircle size={18} strokeWidth={1.8} className="text-text-muted shrink-0" />
                  {t("Ajuda")}
                </a>
                <div className="h-px bg-divider mx-3" />
                {/* INTEGRAÇÃO BACKEND: Sair — chama logout e redireciona para tela de login. */}
                <button
                  type="button"
                  onClick={async () => {
                    setUserMenuOpen(false);
                    await logout();
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-white/10 transition-colors text-text-primary text-[13px] font-[500]"
                >
                  <LogOut size={18} strokeWidth={1.8} className="text-text-muted shrink-0" />
                  {t("Sair")}
                </button>
              </div>
            </div>
          )}
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
        }
        
        aside .group:hover {
          background: var(--color-item-hover) !important;
        }
      `}} />
      </aside>
    </>
  );
}
