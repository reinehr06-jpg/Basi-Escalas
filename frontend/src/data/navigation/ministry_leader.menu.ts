import { NavSection } from "./types";
import {
  LayoutDashboard, CalendarDays, ClipboardList, CheckCheck, UserCheck,
  Repeat2, CalendarOff, Users, BarChart3, Settings, CalendarClock,
} from "lucide-react";

/** Líder de ministério: mesma operação, restrita aos ministérios que lidera. */
export const ministryLeaderMenu: NavSection[] = [
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
      { label: "Voluntários", icon: Users, href: "/volunteers" },
    ],
  },
  {
    title: "MINHA AGENDA",
    items: [
      { label: "Minhas escalas", icon: CalendarClock, href: "/me" },
    ],
  },
  {
    title: "CONFIGURAÇÕES",
    items: [
      { label: "Relatórios", icon: BarChart3, href: "/reports" },
      { label: "Configurações", icon: Settings, href: "/settings" },
    ],
  },
];
