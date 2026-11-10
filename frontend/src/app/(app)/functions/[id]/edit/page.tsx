"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import FunctionForm from "@/components/forms/escalas/FunctionForm";
import { FunctionsService } from "@/services/functions.service";
import type { MinistryFunction } from "@/types/escalas";

export default function EditFunctionPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [fn, setFn] = useState<MinistryFunction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    FunctionsService.getById(id)
      .then((res) => setFn(res.item))
      .catch((err) => toast.error(err.message || t("Function not found.")))
      .finally(() => setLoading(false));
  }, [id, t]);

  if (loading) {
    return <main className="p-6 flex-1 flex items-center justify-center text-sm text-[#6B7280]">{t("Loading...")}</main>;
  }

  if (!fn) {
    return <main className="p-6 flex-1 flex items-center justify-center text-sm text-[#6B7280]">{t("Function not found.")}</main>;
  }

  return <FunctionForm fn={fn} />;
}
