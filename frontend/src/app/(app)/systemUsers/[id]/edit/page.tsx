"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { UsersRound } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/escalas/PageHeader";
import SystemUserForm, { SystemUser } from "@/components/forms/SystemUserForm";
import BackButton from "@/components/BackButton";
import { SystemUsersService } from "@/services/system-users.service";

export default function EditSystemUserPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<SystemUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SystemUsersService.getById(id)
      .then((res) => setUser(res.item))
      .catch((err) => toast.error(err.message || "Usuário não encontrado."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <main className="p-6 pb-5 flex-1 flex flex-col">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 pt-5">
          <BackButton href="/systemUsers" />
        </div>
        <PageHeader icon={UsersRound} title={user ? `Editar ${user.name}` : "Editar usuário"} />
        {loading ? (
          <div className="p-10 text-center text-sm text-[#6B7280]">Carregando…</div>
        ) : user ? (
          <SystemUserForm user={user} />
        ) : (
          <div className="p-10 text-center text-sm text-[#6B7280]">Usuário não encontrado.</div>
        )}
      </div>
    </main>
  );
}
