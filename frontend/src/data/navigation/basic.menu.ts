import { NavSection } from "./types";
import { Settings } from "lucide-react";

export const basicMenu: NavSection[] = [
  {
    title: "CONFIGURAÇÕES",
    items: [
      { label: "Configurações", icon: Settings, href: "/settings" },
    ],
  },
];
