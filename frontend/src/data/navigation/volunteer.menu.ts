import { NavSection } from "./types";
import { CalendarClock, CalendarDays, Repeat2, CalendarOff, Settings } from "lucide-react";

/** Voluntário: só a própria agenda. */
export const volunteerMenu: NavSection[] = [
  {
    title: "MY SCHEDULE",
    items: [
      { label: "My rosters", icon: CalendarClock, href: "/me" },
      { label: "Availability", icon: CalendarDays, href: "/me/availability" },
      { label: "Absences", icon: CalendarOff, href: "/me/absences" },
      { label: "Swaps", icon: Repeat2, href: "/swaps" },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      { label: "Settings", icon: Settings, href: "/settings" },
    ],
  },
];
