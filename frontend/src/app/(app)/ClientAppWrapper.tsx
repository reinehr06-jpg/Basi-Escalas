"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Footer from "@/components/Footer";
import LoadingState from "@/components/ui/LoadingState";
import { useAuth } from "@/context/AuthContext";

export default function ClientAppWrapper({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState variant="brand" minHeight="h-screen" />;
  }

  return (
    <div className="flex h-dvh overflow-hidden font-inter bg-[#F5F5F7]">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col h-dvh overflow-hidden transition-all duration-300 lg:ml-[240px] 2xl:ml-[320px] ml-0">
        <Topbar />
        <div id="app-scroll-container" className="flex-1 min-h-0 flex flex-col overflow-y-auto">
          <div className="flex-[1_0_auto] flex flex-col">{children}</div>
          <Footer />
        </div>
      </div>
    </div>
  );
}
