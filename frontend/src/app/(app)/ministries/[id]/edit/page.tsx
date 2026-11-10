"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import MinistryForm from "@/components/forms/escalas/MinistryForm";
import { MinistriesService } from "@/services/ministries.service";
import type { Ministry } from "@/types/escalas";

export default function EditMinistryPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [ministry, setMinistry] = useState<Ministry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    MinistriesService.getById(id)
      .then((res) => setMinistry(res.item))
      .catch((err) => toast.error(err.message || t("Ministry not found.")))
      .finally(() => setLoading(false));
  }, [id, t]);

  if (loading) {
    return <main className="p-6 flex-1 flex items-center justify-center text-sm text-[#6B7280]">{t("Loading...")}</main>;
  }

  if (!ministry) {
    return <main className="p-6 flex-1 flex items-center justify-center text-sm text-[#6B7280]">{t("Ministry not found.")}</main>;
  }

  return <MinistryForm ministry={ministry} />;
}
