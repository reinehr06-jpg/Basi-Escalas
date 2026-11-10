"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Users, Pencil, Mail, Phone, CalendarCheck, CalendarOff, Award, Clock,
} from "lucide-react";
import DetailHero from "@/components/escalas/DetailHero";
import StatusBadge from "@/components/escalas/StatusBadge";
import VolunteerAvatar from "@/components/escalas/VolunteerAvatar";
import AvailabilityEditor from "@/components/escalas/AvailabilityEditor";
import EmptyState from "@/components/escalas/EmptyState";
import { VolunteersService } from "@/services/volunteers.service";
import type {
  Absence, Availability, Ministry, MinistryFunction, Skill, Volunteer, VolunteerStats,
} from "@/types/escalas";
import { ABSENCE_TYPE_LABELS, formatDate, relativeDays } from "@/lib/escalas-format";

export default function VolunteerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [functions, setFunctions] = useState<MinistryFunction[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [stats, setStats] = useState<VolunteerStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await VolunteersService.getById(id);
      setVolunteer(res.item);
      setMinistries(res.ministries ?? []);
      setFunctions(res.functions ?? []);
      setSkills(res.skills ?? []);
      setAvailabilities(res.availabilities ?? []);
      setAbsences(res.absences ?? []);
      setStats(res.stats ?? null);
    } catch (err) {
      toast.error((err as Error).message || "Voluntário não encontrado.");
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

  if (!volunteer) {
    return <main className="p-6 flex-1"><div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center text-sm text-[#6B7280]">Voluntário não encontrado.</div></main>;
  }

  return (
    <main className="p-4 md:py-5 px-4 md:px-8 flex-1 flex flex-col max-w-screen-2xl mx-auto w-full gap-4">
      <DetailHero
        icon={Users}
        breadcrumb={{ label: t("Volunteers"), href: "/volunteers" }}
        title={volunteer.name}
        subtitle={t("Volunteer profile, availability and history")}
        backHref="/volunteers"
        backTitle={t("Back to Volunteers")}
        actions={
          <Link
            href={`/volunteers/${volunteer.id}/edit`}
            className="h-[38px] px-3.5 sm:px-4 bg-white hover:bg-purple-50 text-[#6D28D9] font-bold text-xs sm:text-sm rounded-[10px] transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <Pencil className="w-3.5 h-3.5 text-[#6D28D9]" strokeWidth={2.4} />
            <span>{t("Edit volunteer")}</span>
          </Link>
        }
      />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 pt-5 flex items-start gap-4">
          <VolunteerAvatar name={volunteer.name} photoUrl={volunteer.photo_url} size={56} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[#1A1A2E] leading-tight">{volunteer.name}</h1>
              <StatusBadge status={volunteer.status} />
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1.5 text-[12px] text-[#6B7280]">
              {volunteer.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {volunteer.email}
                </span>
              )}
              {volunteer.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> {volunteer.phone}
                </span>
              )}
              {volunteer.external_ref?.source && (
                <span className="flex items-center gap-1.5">
                  Importado de {volunteer.external_ref.source}
                </span>
              )}
            </div>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-6">
            {[
              { icon: CalendarCheck, label: "Escalas no total", value: stats.total },
              { icon: Clock, label: "Próximas", value: stats.upcoming },
              { icon: Award, label: "Presenças", value: stats.present },
              { icon: CalendarOff, label: "Faltas", value: stats.absent },
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
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <header className="px-5 h-12 flex items-center border-b border-[#F1F1F4]">
            <h2 className="text-[13px] font-bold text-[#1A1A2E]">Ministérios e funções</h2>
          </header>

          {(volunteer.memberships?.length ?? 0) === 0 ? (
            <EmptyState icon={Users} title="Sem vínculo com ministérios" description="Sem isso, o voluntário não aparece como candidato nas escalas." />
          ) : (
            <ul className="divide-y divide-[#F1F1F4]">
              {volunteer.memberships?.map((membership) => {
                const ministry = ministries.find((m) => m.id === membership.ministry_id);
                const names = membership.function_ids
                  .map((fid) => functions.find((f) => f.id === fid)?.name)
                  .filter(Boolean);

                return (
                  <li key={membership.ministry_id} className="px-5 py-3 flex items-start gap-2.5">
                    <span className="w-1.5 h-8 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: ministry?.color ?? "#6D28D9" }} />
                    <div className="min-w-0">
                      <Link href={`/ministries/${membership.ministry_id}`} className="text-[13px] font-semibold text-[#1A1A2E] hover:text-[#6D28D9] hover:underline">
                        {ministry?.name ?? "Ministério removido"}
                      </Link>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">
                        {names.length > 0 ? names.join(" · ") : "Nenhuma função selecionada"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <header className="px-5 h-12 flex items-center border-b border-[#F1F1F4]">
            <h2 className="text-[13px] font-bold text-[#1A1A2E]">Disponibilidade semanal</h2>
          </header>
          <AvailabilityEditor volunteerId={volunteer.id} initial={availabilities} onSaved={load} />
        </section>

        <section className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <header className="px-5 h-12 flex items-center border-b border-[#F1F1F4]">
            <h2 className="text-[13px] font-bold text-[#1A1A2E]">Habilidades</h2>
          </header>

          {skills.length === 0 ? (
            <EmptyState icon={Award} title="Nenhuma habilidade registrada" />
          ) : (
            <div className="p-5 flex flex-wrap gap-2">
              {skills.map((skill) => {
                const entry = volunteer.skills?.find((s) => s.skill_id === skill.id);
                return (
                  <span
                    key={skill.id}
                    className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-md bg-[#F4EEFF] border border-[#6D28D9]/20 text-[12px] font-semibold text-[#5B21B6]"
                  >
                    {skill.name}
                    {entry?.level && <span className="text-[10.5px] font-normal opacity-75">{entry.level}</span>}
                  </span>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <header className="px-5 h-12 flex items-center justify-between border-b border-[#F1F1F4]">
            <h2 className="text-[13px] font-bold text-[#1A1A2E]">Ausências</h2>
            <Link href={`/absences?volunteer_id=${volunteer.id}`} className="text-[12px] font-semibold text-[#6D28D9] hover:underline">
              Gerenciar
            </Link>
          </header>

          {absences.length === 0 ? (
            <EmptyState icon={CalendarOff} title="Nenhuma ausência registrada" />
          ) : (
            <ul className="divide-y divide-[#F1F1F4]">
              {absences.slice(0, 5).map((absence) => (
                <li key={absence.id} className="px-5 py-3 flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-[#1A1A2E]">
                        {formatDate(absence.starts_at)} – {formatDate(absence.ends_at)}
                      </p>
                      <StatusBadge status={absence.status} />
                    </div>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">
                      {ABSENCE_TYPE_LABELS[absence.type] ?? absence.type} · {absence.reason}
                    </p>
                  </div>
                  <span className="text-[11px] text-[#9CA3AF] shrink-0">{relativeDays(absence.starts_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
