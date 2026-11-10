"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Layers, Pencil, Plus, Users, ClipboardList, Clock, CalendarCheck } from "lucide-react";
import DetailHero from "@/components/escalas/DetailHero";
import StatusBadge from "@/components/escalas/StatusBadge";
import VolunteerAvatar from "@/components/escalas/VolunteerAvatar";
import EmptyState from "@/components/escalas/EmptyState";
import { MinistriesService } from "@/services/ministries.service";
import type { Ministry, MinistryFunction, Volunteer } from "@/types/escalas";

export default function MinistryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

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
      toast.error((err as Error).message || t("Ministry not found."));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <main className="p-6 flex-1 flex items-center justify-center text-sm text-[#6B7280]">{t("Loading...")}</main>;
  }

  if (!ministry) {
    return <main className="p-6 flex-1 flex items-center justify-center text-sm text-[#6B7280]">{t("Ministry not found.")}</main>;
  }

  const settings = ministry.settings ?? {};

  return (
    <main className="p-4 md:py-5 px-4 md:px-8 flex-1 flex flex-col max-w-screen-2xl mx-auto w-full">
      <DetailHero
        icon={Layers}
        breadcrumb={{ label: t("Ministries"), href: "/ministries" }}
        title={ministry.name}
        subtitle={ministry.description ?? t("Ministry records and scheduling rules")}
        backHref="/ministries"
        backTitle={t("Back to Ministries")}
        actions={
          <>
            <Link
              href={`/functions/new?ministry_id=${ministry.id}`}
              className="h-[38px] px-3.5 sm:px-4 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold text-xs sm:text-sm rounded-[10px] transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 text-white" strokeWidth={2.2} />
              <span>{t("New function")}</span>
            </Link>
            <Link
              href={`/ministries/${ministry.id}/edit`}
              className="h-[38px] px-3.5 sm:px-4 bg-white hover:bg-purple-50 text-[#6D28D9] font-bold text-xs sm:text-sm rounded-[10px] transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Pencil className="w-3.5 h-3.5 text-[#6D28D9]" strokeWidth={2.4} />
              <span>{t("Edit ministry")}</span>
            </Link>
          </>
        }
      />

      {/* CARTÃO DE IDENTIDADE */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm mb-4 flex flex-col xl:flex-row gap-5 shrink-0 items-start xl:items-center">
        <div className="flex items-start sm:items-center gap-4 flex-1 border-b xl:border-b-0 xl:border-r border-slate-100 pb-4 xl:pb-0 xl:pr-4 w-full">
          <div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0 flex items-center justify-center"
            style={{ backgroundColor: `${ministry.color ?? "#6D28D9"}1A` }}
          >
            <Layers className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: ministry.color ?? "#6D28D9" }} />
          </div>
          <div className="flex flex-col flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 mb-2 sm:mb-1.5">
              <h2 className="text-base font-extrabold text-slate-900 leading-none uppercase">{ministry.name}</h2>
              <StatusBadge status={ministry.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-1.5 gap-x-3 w-full">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-400">{t("Deadline:")}</span>
                <span className="font-semibold text-slate-900 truncate">{settings.confirmation_deadline_hours ?? 48}h</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <CalendarCheck className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-400">{t("Rest:")}</span>
                <span className="font-semibold text-slate-900 truncate">{settings.min_rest_days ?? 0} {t("days")}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <ClipboardList className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-400">{t("Cap:")}</span>
                <span className="font-semibold text-slate-900 truncate">{settings.max_per_month ?? "—"}/{t("month")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-full xl:max-w-md shrink-0 sm:h-16">
          <div className="flex-1 bg-slate-50 rounded-xl p-3 flex flex-col justify-center border border-slate-100 relative overflow-hidden group hover:border-gray-300 transition-colors min-h-16">
            <Users className="absolute -right-2 -bottom-2 w-8 h-8 text-gray-600/10 group-hover:text-gray-600/20 transition-colors" strokeWidth={2} />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">{t("Volunteers")}</p>
            <div className="flex items-baseline gap-1">
              <p className="text-base font-extrabold text-slate-900 leading-none">{volunteersCount}</p>
              <p className="text-xs font-semibold text-gray-500">{t("linked")}</p>
            </div>
          </div>
          <div className="flex-1 bg-slate-50 rounded-xl p-3 flex flex-col justify-center border border-slate-100 relative overflow-hidden group hover:border-gray-300 transition-colors min-h-16">
            <ClipboardList className="absolute -right-2 -bottom-2 w-8 h-8 text-gray-600/10 group-hover:text-gray-600/20 transition-colors" strokeWidth={2} />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">{t("Functions")}</p>
            <div className="flex items-baseline gap-1">
              <p className="text-base font-extrabold text-emerald-500 leading-none">{functions.length}</p>
              <p className="text-xs font-semibold text-gray-500">{t("active")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <header className="px-5 h-12 flex items-center justify-between border-b border-[#F1F1F4]">
            <h2 className="text-[14px] font-[700] text-[#1A1A2E]">{t("Functions in this ministry")}</h2>
            <Link href={`/functions/new?ministry_id=${ministry.id}`} className="text-[11px] font-[600] text-[#7C3AED] hover:underline flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
              {t("New function")}
            </Link>
          </header>

          {functions.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={t("No function registered")}
              description={t("Without functions this ministry cannot be scheduled.")}
            />
          ) : (
            <ul className="divide-y divide-[#F1F1F4]">
              {functions.map((fn) => (
                <li key={fn.id}>
                  <Link href={`/functions/${fn.id}/edit`} className="px-5 py-3 flex items-center gap-3 hover:bg-[#FAFAFC] transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold text-[#1A1A2E] truncate">{fn.name}</p>
                        {fn.is_leadership && <StatusBadge label={t("Leadership")} tone="purple" />}
                        <StatusBadge status={fn.status} />
                      </div>
                      {fn.description && <p className="text-[11px] text-[#6B7280] mt-0.5 truncate">{fn.description}</p>}
                    </div>
                    <span className="text-[11px] text-[#6B7280] shrink-0">
                      {fn.default_quantity} {t("per schedule")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <header className="px-5 h-12 flex items-center border-b border-[#F1F1F4]">
            <h2 className="text-[14px] font-[700] text-[#1A1A2E]">{t("Leaders")}</h2>
          </header>

          {leaders.length === 0 ? (
            <EmptyState icon={Users} title={t("No leaders defined")} description={t("Define who approves swaps and publishes schedules.")} />
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
              {t("See volunteers")} ({volunteersCount})
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
