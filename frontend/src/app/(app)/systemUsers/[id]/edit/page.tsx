"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import SystemUserForm, { SystemUser } from "@/components/forms/SystemUserForm";
import { SystemUsersService } from "@/services/system-users.service";

export default function EditSystemUserPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [user, setUser] = useState<SystemUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SystemUsersService.getById(id)
      .then((res) => setUser(res.item))
      .catch((err) => toast.error(err.message || t("User not found.")))
      .finally(() => setLoading(false));
  }, [id, t]);

  if (loading) {
    return <main className="p-6 flex-1 flex items-center justify-center text-sm text-[#6B7280]">{t("Loading...")}</main>;
  }

  if (!user) {
    return <main className="p-6 flex-1 flex items-center justify-center text-sm text-[#6B7280]">{t("User not found.")}</main>;
  }

  return <SystemUserForm user={user} />;
}
