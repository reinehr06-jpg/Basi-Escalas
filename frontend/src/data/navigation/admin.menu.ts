import { NavSection } from "./types";
import {
  LayoutDashboard, CalendarDays, ClipboardList, CheckCheck, UserCheck,
  Repeat2, CalendarOff, Users, Layers, GraduationCap, BarChart3,
  Settings, UsersRound,
} from "lucide-react";

/**
 * Admin e coordenação: visão completa de todos os ministérios.
 * Os rótulos são chaves de tradução — a Sidebar aplica t() neles.
 */
export const adminMenu: NavSection[] = [
  {
    title: "SCHEDULING",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { label: "Calendar", icon: CalendarDays, href: "/events" },
      { label: "Rosters", icon: ClipboardList, href: "/schedules" },
      { label: "Confirmations", icon: CheckCheck, href: "/confirmations" },
    ],
  },
  {
    title: "OPERATION",
    items: [
      { label: "Attendance and check-in", icon: UserCheck, href: "/attendance" },
      { label: "Swaps and replacements", icon: Repeat2, href: "/swaps" },
      { label: "Absences", icon: CalendarOff, href: "/absences" },
    ],
  },
  {
    title: "REGISTRATIONS",
    items: [
      { label: "Volunteers", icon: Users, href: "/volunteers" },
      {
        label: "Structure", icon: Layers, isAccordion: true,
        subItems: [
          { label: "Ministries", href: "/ministries" },
          { label: "Functions", href: "/functions" },
        ],
      },
      {
        label: "Training", icon: GraduationCap, isAccordion: true,
        subItems: [
          { label: "Skills", href: "/skills" },
          { label: "Training sessions", href: "/trainings" },
        ],
      },
    ],
  },
  {
    title: "ANALYSIS",
    items: [
      { label: "Reports", icon: BarChart3, href: "/reports" },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      { label: "Users", icon: UsersRound, href: "/systemUsers" },
      { label: "Settings", icon: Settings, href: "/settings" },
    ],
  },
];
