"use client";

import React from "react";
import { CalendarDays } from "lucide-react";
import PageHeader from "@/components/escalas/PageHeader";
import EventForm from "@/components/forms/escalas/EventForm";
import BackButton from "@/components/BackButton";

export default function NewEventPage() {
  return (
    <main className="p-6 pb-5 flex-1 flex flex-col">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 pt-5">
          <BackButton href="/events" />
        </div>
        <PageHeader icon={CalendarDays} title="Novo evento" subtitle="Culto, ensaio ou evento que vai receber escala." />
        <EventForm />
      </div>
    </main>
  );
}
