import { NavSection } from "./types";
import {
  LayoutDashboard, CalendarDays, ClipboardList, CheckCheck, UserCheck,
  Repeat2, CalendarOff, Users, BarChart3, Settings, CalendarClock,
} from "lucide-react";

/** Líder de ministério: mesma operação, restrita aos ministérios que lidera. */
export const ministryLeaderMenu: NavSection[] = [
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
      { label: "Volunteers", icon: Users, href: "/volunteers" },
    ],
  },
  {
    title: "MY SCHEDULE",
    items: [
      { label: "My rosters", icon: CalendarClock, href: "/me" },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      { label: "Reports", icon: BarChart3, href: "/reports" },
      { label: "Settings", icon: Settings, href: "/settings" },
    ],
  },
];
