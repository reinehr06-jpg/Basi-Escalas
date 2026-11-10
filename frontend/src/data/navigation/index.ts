import { NavSection } from "./types";
import { adminMenu } from "./admin.menu";
import { ministryLeaderMenu } from "./ministry_leader.menu";
import { volunteerMenu } from "./volunteer.menu";
import { basicMenu } from "./basic.menu";

/** Papéis vêm do enum UserRole da API. */
export const getFilteredNavSections = (role?: string): NavSection[] => {
  switch (role) {
    case "admin":
    case "coordinator":
      return adminMenu;
    case "ministry_leader":
      return ministryLeaderMenu;
    case "volunteer":
      return volunteerMenu;
    default:
      return basicMenu;
  }
};

export { adminMenu as navSections };
