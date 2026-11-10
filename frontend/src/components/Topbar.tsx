"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, Bell, ChevronDown, Layers, Activity, DollarSign, CheckCircle2, MessageCircle, Church, HelpCircle, PlayCircle, Headphones } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";


export default function Topbar() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const router = useRouter();
  const pathname = usePathname();
  const [isSystemsOpen, setIsSystemsOpen] = useState(false);
  const [isConnectionsOpen, setIsConnectionsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const systemsRef = useRef<HTMLDivElement>(null);
  const connectionsRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const getHelpContent = () => {
    const routeMappings = [
      // -----------------------------------------------------
      // SUB-ROTAS / MICRO SEÇÕES (DEVEM VIR PRIMEIRO!)
      // -----------------------------------------------------
      {
        path: "/members/cadastro",
        title: "Novo Membro",
        desc: "Preencha os dados pessoais, de contato e eclesiásticos para registrar um novo membro na sua igreja.",
        video: "https://www.youtube.com/watch?v=tutorial_novo_membro"
      },
      {
        path: "/registers/members/import",
        title: "Importar Membros (Planilha)",
        desc: "Traga toda a sua base de dados atual de uma só vez usando um arquivo CSV ou Excel. Siga o modelo recomendado.",
        video: "https://www.youtube.com/watch?v=tutorial_importar_membros"
      },
      {
        path: "/cells/register/import",
        title: "Importar Células",
        desc: "Faça o upload da sua planilha de células para cadastrar todas de uma vez no sistema. Super rápido!",
        video: "https://www.youtube.com/watch?v=tutorial_importar_celulas"
      },
      {
        path: "/cells/register",
        title: "Nova Célula",
        desc: "Cadastre uma nova célula definindo o nome, líder, endereço, dia e horário do encontro.",
        video: "https://www.youtube.com/watch?v=tutorial_nova_celula"
      },
      // -----------------------------------------------------
      // ROTAS PRINCIPAIS
      // -----------------------------------------------------
      {
        path: "/members",
        title: "Gestão de Membros",
        desc: "Adicione, edite ou importe membros. Aqui você gerencia o rebanho da sua congregação de forma completa.\n\nEngajamento (0-100%): mede o quanto a pessoa participa (célula, eventos, cursos, WhatsApp) ou, se for líder/pastor, o uso do sistema. Abaixo de 20%, a liderança é avisada para cuidar de perto.",
        video: "https://www.youtube.com/watch?v=tutorial_membros"
      },
      {
        path: "/cells",
        title: "Gestão de Células",
        desc: "Acompanhe suas células, veja onde elas se reúnem e estruture o crescimento da sua rede.",
        video: "https://www.youtube.com/watch?v=tutorial_celulas"
      },
      {
        path: "/branches",
        title: "Gestão de Filiais",
        desc: "Gerencie as congregações, sedes e filiais da sua igreja. Configure os detalhes de cada uma.",
        video: "https://www.youtube.com/watch?v=tutorial_filiais"
      },
      {
        path: "/lideres",
        title: "Líderes e Pastores",
        desc: "Gerencie as lideranças da igreja, defina níveis de acesso e organize a hierarquia espiritual.",
        video: "https://www.youtube.com/watch?v=tutorial_lideres"
      },
      {
        path: "/cults/schedule",
        title: "Cultos e Eventos",
        desc: "Agende cultos, faça o controle de presença e planeje grandes eventos para sua igreja.",
        video: "https://www.youtube.com/watch?v=tutorial_cultos"
      },
      {
        path: "/ministerios",
        title: "Ministérios",
        desc: "Acompanhe os voluntários, escalas e departamentos da igreja de maneira prática.",
        video: "https://www.youtube.com/watch?v=tutorial_ministerios"
      },
      {
        path: "/reports",
        title: "Relatórios e Dados",
        desc: "Visualize estatísticas, crescimento da igreja e gere relatórios detalhados para tomada de decisão.",
        video: "https://www.youtube.com/watch?v=tutorial_relatorios"
      },
      {
        path: "/settings",
        title: "Configurações do Sistema",
        desc: "Ajuste preferências, dados da igreja, acessos e integrações do sistema.",
        video: "https://www.youtube.com/watch?v=tutorial_configuracoes"
      }
    ];

    const match = routeMappings.find(route => pathname.includes(route.path));

    if (match) {
      return match;
    }

    // Default (Dashboard / Home / Others)
    return {
      title: "Visão Geral",
      desc: "Bem-vindo ao painel principal! Assista ao nosso guia rápido para conhecer tudo que o Basiléia OS oferece.",
      video: "https://www.youtube.com/watch?v=tour_completo"
    };
  };

  const helpInfo = getHelpContent();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (systemsRef.current && !systemsRef.current.contains(event.target as Node)) {
        setIsSystemsOpen(false);
      }
      if (connectionsRef.current && !connectionsRef.current.contains(event.target as Node)) {
        setIsConnectionsOpen(false);
      }
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setIsHelpOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      }
      if (e.key === 'Escape') {
        setIsSearchFocused(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const searchableRoutes = [
    { key: "Dashboard", path: "/dashboard" },
    { key: "Members", path: "/registers/members" },
    { key: "System Users", path: "/systemUsers" },
    { key: "Cells", path: "/cells/register" },
    { key: "Cell Metrics", path: "/cells/metrics" },
    { key: "Cell Profiles", path: "/cells/profiles" },
    { key: "Events", path: "/events" },
    { key: "Calendar", path: "/calendar" },
    { key: "Pastoral Care", path: "/solicitations" },
    { key: "Cell Attendances", path: "/cells/attendance" },
    { key: "Cult Attendance", path: "/cults/attendance" },
    { key: "Branches", path: "/branches" },
    { key: "Courses", path: "/courses" },
    { key: "Accepted Jesus", path: "/acceptedJesus" },
    { key: "Services", path: "/cults/schedule" },
    { key: "Settings", path: "/settings" },
    { key: "API Documentation", path: "/api-docs" },
    { key: "Organization Account", path: "/settings/account" },
    { key: "Personal Account & Security", path: "/settings/security" },
    { key: "Connections & API", path: "/settings/connections" },
    { key: "Audit Logs", path: "/settings/logs" },
    { key: "Terms & LGPD Compliance", path: "/settings/terms" },
    { key: "Form Builder", path: "/settings/forms" },
    { key: "Reports Center", path: "/settings/reports" },
    { key: "Plan & Subscription", path: "/settings/plans" },
    { key: "Assistant Configuration", path: "/ai_configs/profile" },
    { key: "Automatic Notification Settings", path: "/ai_configs/notifications" },
    { key: "QR Codes", path: "/qr-codes" },
    { key: "Ministries", path: "/registers/ministries" },
    { key: "Networks", path: "/registers/networks" },
    { key: "Positions", path: "/registers/positions" },
    { key: "Visitors", path: "/registers/visitors" }
  ];

  const filteredRoutes = searchQuery
    ? searchableRoutes.filter(route => 
        t(route.key).toLowerCase().includes(searchQuery.toLowerCase()) || 
        route.key.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : [];

  return (
    <header className="h-[56px] bg-white border-b border-[#E5E7EB] px-4 sm:px-[32px] flex items-center justify-between gap-3 shrink-0 sticky top-0 z-50 w-full">
      <div className="relative flex-1 min-w-0 lg:flex-none lg:w-[340px]" ref={searchContainerRef}>
        <div className={`relative flex items-center h-10 bg-[#F9FAFB] border ${isSearchFocused ? 'border-indigo-400 ring-2 ring-indigo-50' : 'border-[#E5E7EB]'} rounded-[10px] px-3 transition-all`}>
          <Search className={`${isSearchFocused ? 'text-indigo-500' : 'text-[#9CA3AF]'} w-4 h-4 mr-2 shrink-0 transition-colors`} strokeWidth={2.4} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            placeholder={t("General search...")}
            className="bg-transparent border-none outline-none text-[13px] text-[#374151] placeholder-[#9CA3AF] w-full min-w-0"
          />
          <span className="hidden sm:inline text-[#9CA3AF] text-[12px] font-medium shrink-0 ml-2">{t("⌘K")}</span>
        </div>

        {/* SEARCH DROPDOWN */}
        {isSearchFocused && searchQuery && (
          <div className="absolute top-[48px] left-0 w-full bg-white border border-[#E5E7EB] rounded-[10px] shadow-lg py-2 z-50 overflow-hidden">
            {filteredRoutes.length > 0 ? (
              <div className="flex flex-col">
                <div className="px-3 py-2 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                  {t("Navigation")}
                </div>
                {filteredRoutes.map((route, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      router.push(route.path);
                      setIsSearchFocused(false);
                      setSearchQuery("");
                    }}
                    className="flex items-center w-full px-4 py-2 hover:bg-[#F9FAFB] text-left transition-colors"
                  >
                    <Search className="w-4 h-4 text-[#6B7280] mr-3" strokeWidth={2.2} />
                    <span className="text-[13px] font-medium text-[#374151]">
                      {t(route.key)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-center">
                <p className="text-[13px] text-[#6B7280]">
                  {t("No results found for")} &quot;{searchQuery}&quot;
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT - Ações */}
      <div className="flex items-center gap-2 sm:gap-5 shrink-0">
        <div className="relative" ref={helpRef}>
          <button 
            onClick={() => { setIsHelpOpen(!isHelpOpen); setIsSystemsOpen(false); setIsConnectionsOpen(false); }}
            className={`transition-colors p-2 rounded-full ${isHelpOpen ? 'bg-indigo-50 text-indigo-600' : 'text-[#6B7280] hover:text-[#374151]'}`}
          >
            <HelpCircle className="w-[22px] h-[22px]" strokeWidth={2.2} />
          </button>

          {isHelpOpen && (
            <div className="fixed left-4 right-4 top-[60px] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[320px] bg-white border border-[#E5E7EB] rounded-[14px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-[#F1F1F4] bg-indigo-50/50 flex items-center gap-2">
                <HelpCircle className="w-[16px] h-[16px] text-indigo-600" strokeWidth={2.5} />
                <h3 className="text-[13px] font-[700] text-indigo-900">{t("Ajuda: ")}{helpInfo.title}</h3>
              </div>
              <div className="p-4 flex flex-col gap-3">
                <p className="text-[12px] font-[500] text-[#4B5563] leading-relaxed whitespace-pre-line">
                  {helpInfo.desc}
                </p>
                <a 
                  href={helpInfo.video}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#F9FAFB] hover:bg-gray-100 border border-[#E5E7EB] text-[#374151] text-[13px] font-[600] py-2 rounded-[10px] transition-colors mt-2"
                >
                  <PlayCircle className="w-[16px] h-[16px] text-indigo-600" />
                  {t("Assistir Vídeo Tutorial")}
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={systemsRef}>
          <button 
            onClick={() => { setIsSystemsOpen(!isSystemsOpen); setIsConnectionsOpen(false); setIsHelpOpen(false); }}
            className={`transition-colors p-2 rounded-full ${isSystemsOpen ? 'bg-gray-100 text-[#374151]' : 'text-[#6B7280] hover:text-[#374151]'}`}
          >
            <Layers className="w-[22px] h-[22px]" strokeWidth={2.2} />
          </button>

          {isSystemsOpen && (
            <div className="fixed left-4 right-4 top-[60px] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[280px] bg-white border border-[#E5E7EB] rounded-[14px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-[#F1F1F4]">
                <h3 className="text-[13px] font-[700] text-[#1A1A2E]">{t("My Systems")}</h3>
              </div>
              <div className="p-2">
                <button 
                  onClick={() => router.push("/")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#F9FAFB] rounded-[10px] transition-colors group"
                >
                  <div className="w-[36px] h-[36px] rounded-[10px] bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100 group-hover:bg-indigo-100 transition-colors">
                    <Church className="w-[18px] h-[18px] text-indigo-600" strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[13px] font-[600] text-[#1A1A2E]">{t("Basileia Church")}</span>
                    <span className="text-[11px] font-[500] text-[#6B7280]">{t("Church management")}</span>
                  </div>
                </button>
                {(!user?.role || user?.role === 'admin' || user?.role === 'church' || user?.role === 'financial') && (
                  <button 
                    onClick={() => {
                      setIsSystemsOpen(false);
                      router.push("/financial");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#F9FAFB] rounded-[10px] transition-colors group mt-1"
                  >
                    <div className="w-[36px] h-[36px] rounded-[10px] bg-green-50 flex items-center justify-center shrink-0 border border-green-100 group-hover:bg-green-100 transition-colors">
                      <DollarSign className="w-[18px] h-[18px] text-green-600" strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[13px] font-[600] text-[#1A1A2E]">{t("Basileia Finance")}</span>
                      <span className="text-[11px] font-[500] text-[#6B7280]">{t("Complete financial management")}</span>
                    </div>
                  </button>
                )}
                <button 
                  onClick={() => {
                    setIsSystemsOpen(false);
                    router.push("/dashboard");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#F9FAFB] rounded-[10px] transition-colors group mt-1"
                >
                  <div className="w-[36px] h-[36px] rounded-[10px] bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100 group-hover:bg-purple-100 transition-colors">
                    <Headphones className="w-[18px] h-[18px] text-[#7C3AED]" strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[13px] font-[600] text-[#1A1A2E]">{t("Basiléia HelpDesk")}</span>
                    <span className="text-[11px] font-[500] text-[#6B7280]">{t("Central de Atendimento WhatsApp")}</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={connectionsRef}>
          <button 
            onClick={() => { setIsConnectionsOpen(!isConnectionsOpen); setIsSystemsOpen(false); setIsHelpOpen(false); }}
            className={`transition-colors p-2 rounded-full relative ${isConnectionsOpen ? 'bg-gray-100 text-[#374151]' : 'text-[#6B7280] hover:text-[#374151]'}`}
          >
            <Activity className="w-[22px] h-[22px]" strokeWidth={2.2} />
            {/* Indicador de saúde */}
            <span className="absolute top-[4px] right-[4px] w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
          </button>

          {isConnectionsOpen && (
            <div className="fixed left-4 right-4 top-[60px] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[320px] bg-white border border-[#E5E7EB] rounded-[14px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] overflow-hidden z-50">
              <div className="p-5 flex flex-col items-center text-center">
                <div className="w-[48px] h-[48px] rounded-full bg-green-50 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-[24px] h-[24px] text-green-500" strokeWidth={2.2} />
                </div>
                <h3 className="text-[14px] font-[700] text-[#1A1A2E] mb-1.5">{t("Healthy connections")}</h3>
                <p className="text-[12px] font-[500] text-[#6B7280] mb-5">
                  {t("All connections are working perfectly! No instability detected.")}
                </p>
                <button className="w-full bg-[#F9FAFB] hover:bg-gray-100 border border-[#E5E7EB] text-[#374151] text-[13px] font-[600] py-2 rounded-[10px] transition-colors">
                  {t("Review connections")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
