import { NavSection } from "./types";
import { CalendarClock, CalendarDays, Repeat2, CalendarOff, Settings } from "lucide-react";

/** Voluntário: só a própria agenda. */
export const volunteerMenu: NavSection[] = [
  {
    title: "MINHA AGENDA",
    items: [
      { label: "Minhas escalas", icon: CalendarClock, href: "/me" },
      { label: "Disponibilidade", icon: CalendarDays, href: "/me/availability" },
      { label: "Ausências", icon: CalendarOff, href: "/me/absences" },
      { label: "Trocas", icon: Repeat2, href: "/swaps" },
    ],
  },
  {
    title: "CONFIGURAÇÕES",
    items: [
      { label: "Configurações", icon: Settings, href: "/settings" },
    ],
  },
];
