"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import VolunteerForm from "@/components/forms/escalas/VolunteerForm";
import { VolunteersService } from "@/services/volunteers.service";
import type { Volunteer } from "@/types/escalas";

export default function EditVolunteerPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    VolunteersService.getById(id)
      .then((res) => setVolunteer(res.item))
      .catch((err) => toast.error(err.message || t("Volunteer not found.")))
      .finally(() => setLoading(false));
  }, [id, t]);

  if (loading) {
    return <main className="p-6 flex-1 flex items-center justify-center text-sm text-[#6B7280]">{t("Loading...")}</main>;
  }

  if (!volunteer) {
    return <main className="p-6 flex-1 flex items-center justify-center text-sm text-[#6B7280]">{t("Volunteer not found.")}</main>;
  }

  return <VolunteerForm volunteer={volunteer} />;
}
