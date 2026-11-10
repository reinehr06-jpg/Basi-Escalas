import React from "react";
import ClientAppWrapper from "./ClientAppWrapper";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <ClientAppWrapper>{children}</ClientAppWrapper>;
}
