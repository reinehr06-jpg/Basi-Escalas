import { NavSection } from "./types";
import {
  LayoutDashboard, CalendarDays, ClipboardList, CheckCheck, UserCheck,
  Repeat2, CalendarOff, Users, Layers, GraduationCap, BarChart3,
  Settings, UsersRound,
} from "lucide-react";

/** Admin e coordenação: visão completa de todos os ministérios. */
export const adminMenu: NavSection[] = [
  {
    title: "ESCALAS",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { label: "Calendário", icon: CalendarDays, href: "/events" },
      { label: "Escalas", icon: ClipboardList, href: "/schedules" },
      { label: "Confirmações", icon: CheckCheck, href: "/confirmations" },
    ],
  },
  {
    title: "OPERAÇÃO",
    items: [
      { label: "Presenças e check-in", icon: UserCheck, href: "/attendance" },
      { label: "Trocas e substituições", icon: Repeat2, href: "/swaps" },
      { label: "Ausências", icon: CalendarOff, href: "/absences" },
    ],
  },
  {
    title: "CADASTROS",
    items: [
      { label: "Voluntários", icon: Users, href: "/volunteers" },
      {
        label: "Estrutura", icon: Layers, isAccordion: true,
        subItems: [
          { label: "Ministérios", href: "/ministries" },
          { label: "Funções", href: "/functions" },
        ],
      },
      {
        label: "Capacitação", icon: GraduationCap, isAccordion: true,
        subItems: [
          { label: "Habilidades", href: "/skills" },
          { label: "Treinamentos", href: "/trainings" },
        ],
      },
    ],
  },
  {
    title: "ANÁLISE",
    items: [
      { label: "Relatórios", icon: BarChart3, href: "/reports" },
    ],
  },
  {
    title: "CONFIGURAÇÕES",
    items: [
      { label: "Usuários", icon: UsersRound, href: "/systemUsers" },
      { label: "Configurações", icon: Settings, href: "/settings" },
    ],
  },
];
