"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/escalas/PageHeader";
import EventForm from "@/components/forms/escalas/EventForm";
import BackButton from "@/components/BackButton";
import { EventsService } from "@/services/events.service";
import type { CalendarEvent } from "@/types/escalas";

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    EventsService.getById(id)
      .then((res) => setEvent(res.item))
      .catch((err) => toast.error(err.message || "Evento não encontrado."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <main className="p-6 pb-5 flex-1 flex flex-col">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 pt-5">
          <BackButton href={`/events/${id}`} />
        </div>
        <PageHeader icon={CalendarDays} title={event ? `Editar ${event.title}` : "Editar evento"} />
        {loading ? (
          <div className="p-10 text-center text-sm text-[#6B7280]">Carregando…</div>
        ) : event ? (
          <EventForm event={event} />
        ) : (
          <div className="p-10 text-center text-sm text-[#6B7280]">Evento não encontrado.</div>
        )}
      </div>
    </main>
  );
}
