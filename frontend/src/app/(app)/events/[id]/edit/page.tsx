"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import EventForm from "@/components/forms/escalas/EventForm";
import { EventsService } from "@/services/events.service";
import type { CalendarEvent } from "@/types/escalas";

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    EventsService.getById(id)
      .then((res) => setEvent(res.item))
      .catch((err) => toast.error(err.message || t("Event not found.")))
      .finally(() => setLoading(false));
  }, [id, t]);

  if (loading) {
    return <main className="p-6 flex-1 flex items-center justify-center text-sm text-[#6B7280]">{t("Loading...")}</main>;
  }

  if (!event) {
    return <main className="p-6 flex-1 flex items-center justify-center text-sm text-[#6B7280]">{t("Event not found.")}</main>;
  }

  return <EventForm event={event} />;
}
