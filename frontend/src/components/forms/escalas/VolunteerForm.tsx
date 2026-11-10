"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Trash2, Plus } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
import { VolunteersService } from "@/services/volunteers.service";
import { MinistriesService } from "@/services/ministries.service";
import { FunctionsService } from "@/services/functions.service";
import { SkillsService } from "@/services/skills.service";
import type { Membership, Ministry, MinistryFunction, Skill, Volunteer } from "@/types/escalas";
import { WEEKDAYS } from "@/types/escalas";
import { toInputDate } from "@/lib/escalas-format";

interface Props {
  volunteer?: Volunteer;
}

export default function VolunteerForm({ volunteer }: Props) {
  const router = useRouter();
  const editing = Boolean(volunteer);

  const [name, setName] = useState(volunteer?.name ?? "");
  const [email, setEmail] = useState(volunteer?.email ?? "");
  const [phone, setPhone] = useState(volunteer?.phone ?? "");
  const [birthDate, setBirthDate] = useState(toInputDate(volunteer?.birth_date));
  const [status, setStatus] = useState(volunteer?.status ?? "active");
  const [notes, setNotes] = useState(volunteer?.notes ?? "");

  const [memberships, setMemberships] = useState<Membership[]>(volunteer?.memberships ?? []);
  const [skillIds, setSkillIds] = useState<string[]>(
    (volunteer?.skills ?? []).map((s) => s.skill_id),
  );

  const [maxPerMonth, setMaxPerMonth] = useState(String(volunteer?.preferences?.max_per_month ?? ""));
  const [minRest, setMinRest] = useState(String(volunteer?.preferences?.min_rest_days ?? ""));
  const [preferredWeekdays, setPreferredWeekdays] = useState<number[]>(
    volunteer?.preferences?.preferred_weekdays ?? [],
  );

  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [functions, setFunctions] = useState<MinistryFunction[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    MinistriesService.list({ itemsPerPage: 200, status: "active" })
      .then((res) => setMinistries(res.data ?? []))
      .catch(() => setMinistries([]));
    FunctionsService.list({ itemsPerPage: 500, status: "active" })
      .then((res) => setFunctions(res.data ?? []))
      .catch(() => setFunctions([]));
    SkillsService.list({ itemsPerPage: 200 })
      .then((res) => setSkills(res.data ?? []))
      .catch(() => setSkills([]));
  }, []);

  const functionsByMinistry = useMemo(() => {
    const map: Record<string, MinistryFunction[]> = {};
    for (const fn of functions) {
      (map[fn.ministry_id] ??= []).push(fn);
    }
    return map;
  }, [functions]);

  const availableMinistries = ministries.filter(
    (m) => !memberships.some((membership) => membership.ministry_id === m.id),
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);

    // Preserva nível e certificação das habilidades que o voluntário já tinha.
    const previousSkills = volunteer?.skills ?? [];
    const payload = {
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      birth_date: birthDate || null,
      status,
      notes: notes?.trim() || null,
      memberships,
      skills: skillIds.map(
        (skillId) => previousSkills.find((s) => s.skill_id === skillId) ?? { skill_id: skillId },
      ),
      preferences: {
        max_per_month: maxPerMonth === "" ? null : Number(maxPerMonth),
        min_rest_days: minRest === "" ? null : Number(minRest),
        preferred_weekdays: preferredWeekdays,
      },
    };

    try {
      const res = editing && volunteer
        ? await VolunteersService.update(volunteer.id, payload)
        : await VolunteersService.create(payload);
      toast.success(res.message);
      router.push(`/volunteers/${res.item.id}`);
      router.refresh();
    } catch (err) {
      const apiError = err as Error & { errors?: Record<string, string[]> };
      setErrors(apiError.errors ?? {});
      toast.error(apiError.message || "Não foi possível salvar o voluntário.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6 p-6">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-[6px] md:col-span-2">
          <label htmlFor="v-name" className="text-[13px] font-[600] text-[#4B5563]">
            Nome completo <span className="text-[#EF4444] ml-0.5">*</span>
          </label>
          <input
            id="v-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`h-[42px] px-3 rounded-lg border text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9] ${
              errors.name ? "border-[#EF4444]" : "border-[#E5E7EB]"
            }`}
            required
          />
          {errors.name && <span className="text-[11px] text-[#EF4444]">{errors.name[0]}</span>}
        </div>

        <div className="flex flex-col gap-[6px]">
          <label htmlFor="v-email" className="text-[13px] font-[600] text-[#4B5563]">E-mail</label>
          <input
            id="v-email"
            type="email"
            value={email ?? ""}
            onChange={(e) => setEmail(e.target.value)}
            className="h-[42px] px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
          />
        </div>

        <div className="flex flex-col gap-[6px]">
          <label htmlFor="v-phone" className="text-[13px] font-[600] text-[#4B5563]">Telefone</label>
          <input
            id="v-phone"
            value={phone ?? ""}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+55 51 99999-0000"
            className="h-[42px] px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
          />
        </div>

        <div className="flex flex-col gap-[6px]">
          <label htmlFor="v-birth" className="text-[13px] font-[600] text-[#4B5563]">Nascimento</label>
          <input
            id="v-birth"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="h-[42px] px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
          />
        </div>

        <div className="flex flex-col gap-[6px]">
          <label className="text-[13px] font-[600] text-[#4B5563]">Situação</label>
          <CustomSelect
            value={status}
            onChange={(value: string) => setStatus(value as typeof status)}
            className="h-[42px]"
            options={[
              { value: "active", label: "Ativo" },
              { value: "on_leave", label: "Afastado" },
              { value: "inactive", label: "Inativo" },
            ]}
          />
        </div>
      </section>

      <section>
        <h2 className="text-[13px] font-bold text-[#1A1A2E]">Ministérios e funções</h2>
        <p className="text-[11px] text-[#6B7280] mt-0.5 mb-3">
          O voluntário só aparece como candidato nas funções marcadas aqui.
        </p>

        <div className="flex flex-col gap-3">
          {memberships.map((membership, index) => {
            const ministry = ministries.find((m) => m.id === membership.ministry_id);
            const options = functionsByMinistry[membership.ministry_id] ?? [];

            return (
              <div key={membership.ministry_id} className="rounded-xl border border-[#E5E7EB] p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-1.5 h-6 rounded-full shrink-0" style={{ backgroundColor: ministry?.color ?? "#6D28D9" }} />
                    <p className="text-[13px] font-semibold text-[#1A1A2E] truncate">
                      {ministry?.name ?? "Ministério removido"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMemberships(memberships.filter((_, i) => i !== index))}
                    className="w-8 h-8 rounded-lg bg-[#EF4444]/10 flex items-center justify-center hover:bg-[#EF4444]/20 transition-colors shrink-0"
                    aria-label={`Remover ${ministry?.name ?? "ministério"}`}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" strokeWidth={2.2} />
                  </button>
                </div>

                <CustomSelect
                  value={membership.function_ids}
                  onChange={(value: string[]) =>
                    setMemberships(
                      memberships.map((m, i) => (i === index ? { ...m, function_ids: value } : m)),
                    )
                  }
                  placeholder={options.length ? "Selecione as funções" : "Este ministério ainda não tem funções"}
                  multiple
                  searchable
                  disabled={options.length === 0}
                  className="h-[42px]"
                  options={options.map((fn) => ({ value: fn.id, label: fn.name }))}
                />
              </div>
            );
          })}

          {availableMinistries.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <CustomSelect
                  value=""
                  onChange={(value: string) => {
                    if (!value) return;
                    setMemberships([
                      ...memberships,
                      { ministry_id: value, function_ids: [], is_leader: false },
                    ]);
                  }}
                  placeholder="Adicionar ministério"
                  searchable
                  className="h-[42px]"
                  options={availableMinistries.map((m) => ({ value: m.id, label: m.name }))}
                />
              </div>
              <Plus className="w-4 h-4 text-[#9CA3AF] shrink-0" />
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-[13px] font-bold text-[#1A1A2E]">Habilidades</h2>
        <p className="text-[11px] text-[#6B7280] mt-0.5 mb-3">
          Usadas para alertar quando uma função exige algo que a pessoa não tem.
        </p>
        <CustomSelect
          value={skillIds}
          onChange={(value: string[]) => setSkillIds(value)}
          placeholder="Nenhuma habilidade registrada"
          multiple
          searchable
          className="h-[42px]"
          options={skills.map((s) => ({ value: s.id, label: s.name }))}
        />
      </section>

      <section>
        <h2 className="text-[13px] font-bold text-[#1A1A2E]">Preferências de escala</h2>
        <p className="text-[11px] text-[#6B7280] mt-0.5 mb-3">
          Em branco, vale a regra do ministério.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="v-max" className="text-[13px] font-[600] text-[#4B5563]">Máximo por mês</label>
            <input
              id="v-max"
              type="number"
              min={0}
              value={maxPerMonth}
              onChange={(e) => setMaxPerMonth(e.target.value)}
              placeholder="Sem limite próprio"
              className="h-[42px] px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label htmlFor="v-rest" className="text-[13px] font-[600] text-[#4B5563]">Folga mínima (dias)</label>
            <input
              id="v-rest"
              type="number"
              min={0}
              value={minRest}
              onChange={(e) => setMinRest(e.target.value)}
              placeholder="Usar a regra do ministério"
              className="h-[42px] px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
            />
          </div>

          <div className="flex flex-col gap-[6px] sm:col-span-2">
            <span className="text-[13px] font-[600] text-[#4B5563]">Dias que prefere servir</span>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((label, index) => {
                const active = preferredWeekdays.includes(index);
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setPreferredWeekdays(
                        active
                          ? preferredWeekdays.filter((d) => d !== index)
                          : [...preferredWeekdays, index],
                      )
                    }
                    className={`h-9 px-3 rounded-lg border text-[12px] font-semibold transition-colors ${
                      active
                        ? "bg-[#6D28D9] text-white border-[#6D28D9]"
                        : "bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-[#F9FAFB]"
                    }`}
                  >
                    {label.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-[6px]">
        <label htmlFor="v-notes" className="text-[13px] font-[600] text-[#4B5563]">Observações</label>
        <textarea
          id="v-notes"
          value={notes ?? ""}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="px-3 py-2.5 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9] resize-y"
        />
      </section>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F1F1F4]">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 h-9 rounded-lg border border-[#E5E7EB] bg-white text-[13px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB] transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[#6D28D9] text-white text-[13px] font-semibold hover:bg-[#5B21B6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <Save className="w-4 h-4" strokeWidth={2.4} />
          {saving ? "Salvando…" : editing ? "Salvar alterações" : "Cadastrar voluntário"}
        </button>
      </div>
    </form>
  );
}
