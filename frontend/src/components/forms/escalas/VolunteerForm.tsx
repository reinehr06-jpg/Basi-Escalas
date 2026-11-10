"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Users, Layers, Award, SlidersHorizontal, Trash2 } from "lucide-react";
import FormInput from "@/components/ui/FormInput";
import FormSelect from "@/components/ui/FormSelect";
import { FormCard, FormHero, FormSection } from "@/components/escalas/FormShell";
import { VolunteersService } from "@/services/volunteers.service";
import { MinistriesService } from "@/services/ministries.service";
import { FunctionsService } from "@/services/functions.service";
import { SkillsService } from "@/services/skills.service";
import type { Membership, Ministry, MinistryFunction, Skill, Volunteer } from "@/types/escalas";
import { WEEKDAYS } from "@/types/escalas";
import { toInputDate } from "@/lib/escalas-format";

const BACK = "/volunteers";

export default function VolunteerForm({ volunteer }: { volunteer?: Volunteer }) {
  const { t } = useTranslation();
  const router = useRouter();
  const editing = Boolean(volunteer);

  const [openSection, setOpenSection] = useState<string | null>("info");
  const toggleSection = (key: string) => setOpenSection((prev) => (prev === key ? null : key));

  const [name, setName] = useState(volunteer?.name ?? "");
  const [email, setEmail] = useState(volunteer?.email ?? "");
  const [phone, setPhone] = useState(volunteer?.phone ?? "");
  const [birthDate, setBirthDate] = useState(toInputDate(volunteer?.birth_date));
  const [status, setStatus] = useState(volunteer?.status ?? "active");
  const [notes, setNotes] = useState(volunteer?.notes ?? "");

  const [memberships, setMemberships] = useState<Membership[]>(volunteer?.memberships ?? []);
  const [skillIds, setSkillIds] = useState<string[]>((volunteer?.skills ?? []).map((s) => s.skill_id));

  const [maxPerMonth, setMaxPerMonth] = useState(String(volunteer?.preferences?.max_per_month ?? ""));
  const [minRest, setMinRest] = useState(String(volunteer?.preferences?.min_rest_days ?? ""));
  const [preferredWeekdays, setPreferredWeekdays] = useState<number[]>(
    volunteer?.preferences?.preferred_weekdays ?? [],
  );

  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [functions, setFunctions] = useState<MinistryFunction[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    MinistriesService.list({ itemsPerPage: 200, status: "active" }).then((r) => setMinistries(r.data ?? [])).catch(() => setMinistries([]));
    FunctionsService.list({ itemsPerPage: 500, status: "active" }).then((r) => setFunctions(r.data ?? [])).catch(() => setFunctions([]));
    SkillsService.list({ itemsPerPage: 200 }).then((r) => setSkills(r.data ?? [])).catch(() => setSkills([]));
  }, []);

  const functionsByMinistry = useMemo(() => {
    const map: Record<string, MinistryFunction[]> = {};
    for (const fn of functions) (map[fn.ministry_id] ??= []).push(fn);
    return map;
  }, [functions]);

  const availableMinistries = ministries.filter(
    (m) => !memberships.some((membership) => membership.ministry_id === m.id),
  );

  const handleSave = async () => {
    setErrors({});

    if (!name.trim()) {
      setErrors({ name: t("Required field") });
      setOpenSection("info");
      return;
    }

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
      setErrors(Object.fromEntries(Object.entries(apiError.errors ?? {}).map(([k, v]) => [k, v[0]])));
      toast.error(apiError.message || t("Could not save the volunteer."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="p-6 pb-5 flex-1 flex flex-col">
      <FormHero
        icon={Users}
        title={editing ? t("Edit volunteer") : t("New volunteer")}
        subtitle={t("Personal data, ministries, functions and scheduling preferences.")}
        backHref={BACK}
        requiredNote={t("Required fields to save the volunteer.")}
        onSave={handleSave}
        saving={saving}
        disabled={!name.trim()}
        saveLabel={editing ? t("Save changes") : t("Save volunteer")}
      />

      <FormCard>
        <FormSection
          icon={Users}
          title={t("Personal information")}
          description={t("How to identify and contact the volunteer.")}
          required
          open={openSection === "info"}
          onToggle={() => toggleSection("info")}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
            <FormInput
              label={t("Full name")}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
              }}
              error={errors.name}
              required
            />
            <FormSelect
              label={t("Status")}
              value={status}
              onChange={(value: string) => setStatus(value as typeof status)}
              placeholder={t("Select")}
              options={[
                { value: "active", label: t("Active") },
                { value: "on_leave", label: t("On leave") },
                { value: "inactive", label: t("Inactive") },
              ]}
            />
            <FormInput
              label={t("Email")}
              type="email"
              value={email ?? ""}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />
            <FormInput
              label={t("Phone")}
              value={phone ?? ""}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+55 51 99999-0000"
            />
            <FormInput
              label={t("Birth date")}
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
            <div className="md:col-span-2 flex flex-col gap-[6px] w-full">
              <label className="text-[13px] font-[600] text-[#4B5563]">{t("Notes")}</label>
              <textarea
                value={notes ?? ""}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-[12px] py-[10px] bg-white border border-[#E5E7EB] rounded-[8px] text-[13px] text-[#1A1A2E] placeholder-[#9CA3AF] outline-none transition-all focus:ring-1 focus:ring-[#6D28D9] focus:border-[#6D28D9] hover:border-[#D1D5DB] resize-y"
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          icon={Layers}
          title={t("Ministries and functions")}
          description={t("The volunteer only shows up as a candidate for the functions marked here.")}
          open={openSection === "ministries"}
          onToggle={() => toggleSection("ministries")}
        >
          <div className="flex flex-col gap-3 mb-2">
            {memberships.map((membership, index) => {
              const ministry = ministries.find((m) => m.id === membership.ministry_id);
              const options = functionsByMinistry[membership.ministry_id] ?? [];

              return (
                <div key={membership.ministry_id} className="rounded-[10px] border border-[#E5E7EB] bg-white p-4">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-6 rounded-full shrink-0" style={{ backgroundColor: ministry?.color ?? "#6D28D9" }} />
                      <p className="text-[13px] font-semibold text-[#1A1A2E] truncate">
                        {ministry?.name ?? t("Removed ministry")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMemberships(memberships.filter((_, i) => i !== index))}
                      className="w-8 h-8 rounded-lg bg-[#EF4444]/10 flex items-center justify-center hover:bg-[#EF4444]/20 transition-colors shrink-0"
                      aria-label={t("Remove")}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" strokeWidth={2.2} />
                    </button>
                  </div>

                  <FormSelect
                    label={t("Functions")}
                    value={membership.function_ids}
                    onChange={(value: string[]) =>
                      setMemberships(memberships.map((m, i) => (i === index ? { ...m, function_ids: value } : m)))
                    }
                    placeholder={options.length ? t("Select the functions") : t("This ministry has no functions yet")}
                    multiple
                    searchable
                    disabled={options.length === 0}
                    options={options.map((fn) => ({ value: fn.id, label: fn.name }))}
                  />
                </div>
              );
            })}

            {availableMinistries.length > 0 && (
              <FormSelect
                label={t("Add ministry")}
                value=""
                onChange={(value: string) => {
                  if (!value) return;
                  setMemberships([...memberships, { ministry_id: value, function_ids: [], is_leader: false }]);
                }}
                placeholder={t("Select a ministry")}
                searchable
                options={availableMinistries.map((m) => ({ value: m.id, label: m.name }))}
              />
            )}
          </div>
        </FormSection>

        <FormSection
          icon={Award}
          title={t("Skills")}
          description={t("Used to warn when a function requires something the person does not have.")}
          open={openSection === "skills"}
          onToggle={() => toggleSection("skills")}
        >
          <div className="grid grid-cols-1 gap-6 mb-2">
            <FormSelect
              label={t("Skills")}
              value={skillIds}
              onChange={(value: string[]) => setSkillIds(value)}
              placeholder={t("No skill registered")}
              multiple
              searchable
              options={skills.map((s) => ({ value: s.id, label: s.name }))}
            />
          </div>
        </FormSection>

        <FormSection
          icon={SlidersHorizontal}
          title={t("Scheduling preferences")}
          description={t("Left blank, the ministry rule applies.")}
          open={openSection === "preferences"}
          onToggle={() => toggleSection("preferences")}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
            <FormInput
              label={t("Maximum per month")}
              type="number"
              min={0}
              value={maxPerMonth}
              onChange={(e) => setMaxPerMonth(e.target.value)}
              placeholder={t("No personal limit")}
            />
            <FormInput
              label={t("Minimum rest (days)")}
              type="number"
              min={0}
              value={minRest}
              onChange={(e) => setMinRest(e.target.value)}
              placeholder={t("Use the ministry rule")}
            />
            <div className="md:col-span-2 flex flex-col gap-[6px] w-full">
              <span className="text-[13px] font-[600] text-[#4B5563]">{t("Preferred days to serve")}</span>
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
                          active ? preferredWeekdays.filter((d) => d !== index) : [...preferredWeekdays, index],
                        )
                      }
                      className={`h-[42px] px-4 rounded-[8px] border text-[13px] font-semibold transition-colors ${
                        active
                          ? "bg-[#6D28D9] text-white border-[#6D28D9]"
                          : "bg-white text-[#4B5563] border-[#E5E7EB] hover:border-[#D1D5DB]"
                      }`}
                    >
                      {label.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </FormSection>
      </FormCard>
    </main>
  );
}
