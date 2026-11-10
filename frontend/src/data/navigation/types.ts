import { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  icon: any;
  href?: string;
  isAccordion?: boolean;
  subItems?: { label: string; href: string }[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}
