"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Layers, Pencil, Plus, Users, ClipboardList, Clock, CalendarCheck } from "lucide-react";
import PageHeader from "@/components/escalas/PageHeader";
import StatusBadge from "@/components/escalas/StatusBadge";
import VolunteerAvatar from "@/components/escalas/VolunteerAvatar";
import EmptyState from "@/components/escalas/EmptyState";
import BackButton from "@/components/BackButton";
import { MinistriesService } from "@/services/ministries.service";
import type { Ministry, MinistryFunction, Volunteer } from "@/types/escalas";

export default function MinistryDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [ministry, setMinistry] = useState<Ministry | null>(null);
  const [functions, setFunctions] = useState<MinistryFunction[]>([]);
  const [leaders, setLeaders] = useState<Volunteer[]>([]);
  const [volunteersCount, setVolunteersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await MinistriesService.getById(id);
      setMinistry(res.item);
      setFunctions(res.functions ?? []);
      setLeaders(res.leaders ?? []);
      setVolunteersCount(res.volunteers_count ?? 0);
    } catch (err) {
      toast.error((err as Error).message || "Ministério não encontrado.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <main className="p-6 flex-1"><div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center text-sm text-[#6B7280]">Carregando…</div></main>;
  }

  if (!ministry) {
    return <main className="p-6 flex-1"><div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center text-sm text-[#6B7280]">Ministério não encontrado.</div></main>;
  }

  const settings = ministry.settings ?? {};

  return (
    <main className="p-6 pb-5 flex-1 flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 pt-5">
          <BackButton href="/ministries" />
        </div>

        <PageHeader
          icon={Layers}
          title={ministry.name}
          subtitle={ministry.description ?? "Sem descrição."}
          tint={`${ministry.color ?? "#6D28D9"}1A`}
          color={ministry.color ?? "#6D28D9"}
          actions={
            <>
              <StatusBadge status={ministry.status} />
              <Link
                href={`/ministries/${ministry.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-[#E5E7EB] bg-white text-[13px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB] transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" strokeWidth={2.2} />
                Editar
              </Link>
            </>
          }
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-6">
          {[
            { icon: Users, label: "Voluntários", value: volunteersCount },
            { icon: ClipboardList, label: "Funções", value: functions.length },
            { icon: Clock, label: "Prazo de confirmação", value: `${settings.confirmation_deadline_hours ?? 48}h` },
            { icon: CalendarCheck, label: "Folga mínima", value: `${settings.min_rest_days ?? 0} dia(s)` },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-[#E5E7EB] p-3.5">
              <div className="flex items-center gap-1.5 text-[#9CA3AF]">
                <stat.icon className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold uppercase tracking-wide">{stat.label}</span>
              </div>
              <p className="text-[20px] font-bold text-[#1A1A2E] mt-1 tabular-nums">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <header className="px-5 h-12 flex items-center justify-between border-b border-[#F1F1F4]">
            <h2 className="text-[13px] font-bold text-[#1A1A2E]">Funções deste ministério</h2>
            <Link
              href={`/functions/new?ministry_id=${ministry.id}`}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#6D28D9] hover:underline"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
              Nova função
            </Link>
          </header>

          {functions.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Nenhuma função cadastrada"
              description="Sem funções, este ministério não pode ser escalado."
              action={
                <Link
                  href={`/functions/new?ministry_id=${ministry.id}`}
                  className="inline-flex items-center justify-center px-4 h-9 bg-[#6D28D9] text-white text-[13px] font-semibold rounded-lg hover:bg-[#5B21B6] transition-colors"
                >
                  Criar primeira função
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-[#F1F1F4]">
              {functions.map((fn) => (
                <li key={fn.id}>
                  <Link href={`/functions/${fn.id}/edit`} className="px-5 py-3 flex items-center gap-3 hover:bg-[#FAFAFC] transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold text-[#1A1A2E] truncate">{fn.name}</p>
                        {fn.is_leadership && <StatusBadge label="Liderança" tone="purple" />}
                        <StatusBadge status={fn.status} />
                      </div>
                      {fn.description && <p className="text-[11px] text-[#6B7280] mt-0.5 truncate">{fn.description}</p>}
                    </div>
                    <span className="text-[11px] text-[#6B7280] shrink-0">
                      {fn.default_quantity} por escala
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <header className="px-5 h-12 flex items-center border-b border-[#F1F1F4]">
            <h2 className="text-[13px] font-bold text-[#1A1A2E]">Líderes</h2>
          </header>

          {leaders.length === 0 ? (
            <EmptyState icon={Users} title="Sem líderes definidos" description="Defina quem aprova trocas e publica escalas." />
          ) : (
            <ul className="divide-y divide-[#F1F1F4]">
              {leaders.map((leader) => (
                <li key={leader.id}>
                  <Link href={`/volunteers/${leader.id}`} className="px-5 py-3 flex items-center gap-2.5 hover:bg-[#FAFAFC] transition-colors">
                    <VolunteerAvatar name={leader.name} photoUrl={leader.photo_url} />
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#1A1A2E] truncate">{leader.name}</p>
                      {leader.email && <p className="text-[11px] text-[#6B7280] truncate">{leader.email}</p>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="p-4 border-t border-[#F1F1F4]">
            <Link
              href={`/volunteers?ministry_id=${ministry.id}`}
              className="flex items-center justify-center gap-1.5 w-full h-9 rounded-lg border border-[#E5E7EB] text-[13px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB] transition-colors"
            >
              <Users className="w-4 h-4" strokeWidth={2.2} />
              Ver voluntários ({volunteersCount})
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
