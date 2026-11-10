"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Users } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/escalas/PageHeader";
import VolunteerForm from "@/components/forms/escalas/VolunteerForm";
import BackButton from "@/components/BackButton";
import { VolunteersService } from "@/services/volunteers.service";
import type { Volunteer } from "@/types/escalas";

export default function EditVolunteerPage() {
  const { id } = useParams<{ id: string }>();
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    VolunteersService.getById(id)
      .then((res) => setVolunteer(res.item))
      .catch((err) => toast.error(err.message || "Voluntário não encontrado."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <main className="p-6 pb-5 flex-1 flex flex-col">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 pt-5">
          <BackButton href={`/volunteers/${id}`} />
        </div>
        <PageHeader icon={Users} title={volunteer ? `Editar ${volunteer.name}` : "Editar voluntário"} />
        {loading ? (
          <div className="p-10 text-center text-sm text-[#6B7280]">Carregando…</div>
        ) : volunteer ? (
          <VolunteerForm volunteer={volunteer} />
        ) : (
          <div className="p-10 text-center text-sm text-[#6B7280]">Voluntário não encontrado.</div>
        )}
      </div>
    </main>
  );
}
