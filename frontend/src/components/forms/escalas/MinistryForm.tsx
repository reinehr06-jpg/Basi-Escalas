"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Layers, SlidersHorizontal, X } from "lucide-react";
import FormInput from "@/components/ui/FormInput";
import FormSelect from "@/components/ui/FormSelect";
import { FormCard, FormHero, FormSection } from "@/components/escalas/FormShell";
import { MinistriesService } from "@/services/ministries.service";
import { VolunteersService } from "@/services/volunteers.service";
import type { Ministry, Volunteer } from "@/types/escalas";

const COLORS = ["#6D28D9", "#0EA5E9", "#F59E0B", "#EC4899", "#10B981", "#6366F1", "#EF4444", "#0F172A"];
const BACK = "/ministries";

export default function MinistryForm({ ministry }: { ministry?: Ministry }) {
  const { t } = useTranslation();
  const router = useRouter();
  const editing = Boolean(ministry);

  const [openSection, setOpenSection] = useState<string | null>("info");
  const toggleSection = (key: string) => setOpenSection((prev) => (prev === key ? null : key));

  const [name, setName] = useState(ministry?.name ?? "");
  const [description, setDescription] = useState(ministry?.description ?? "");
  const [color, setColor] = useState(ministry?.color ?? COLORS[0]);
  const [status, setStatus] = useState<"active" | "inactive">(ministry?.status ?? "active");
  const [leaderIds, setLeaderIds] = useState<string[]>(ministry?.leader_ids ?? []);
  const [deadline, setDeadline] = useState(String(ministry?.settings?.confirmation_deadline_hours ?? 48));
  const [minRest, setMinRest] = useState(String(ministry?.settings?.min_rest_days ?? 7));
  const [maxPerMonth, setMaxPerMonth] = useState(String(ministry?.settings?.max_per_month ?? 5));

  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    VolunteersService.list({ itemsPerPage: 200, status: "active" })
      .then((res) => setVolunteers(res.data ?? []))
      .catch(() => setVolunteers([]));
  }, []);

  const handleSave = async () => {
    setErrors({});

    if (!name.trim()) {
      setErrors({ name: t("Required field") });
      setOpenSection("info");
      return;
    }

    setSaving(true);

    const payload = {
      name: name.trim(),
      description: description?.trim() || null,
      color,
      status,
      leader_ids: leaderIds,
      settings: {
        confirmation_deadline_hours: Number(deadline) || 0,
        min_rest_days: Number(minRest) || 0,
        max_per_month: Number(maxPerMonth) || 0,
      },
    };

    try {
      const res = editing && ministry
        ? await MinistriesService.update(ministry.id, payload)
        : await MinistriesService.create(payload);
      toast.success(res.message);
      router.push(`/ministries/${res.item.id}`);
      router.refresh();
    } catch (err) {
      const apiError = err as Error & { errors?: Record<string, string[]> };
      setErrors(
        Object.fromEntries(Object.entries(apiError.errors ?? {}).map(([k, v]) => [k, v[0]])),
      );
      toast.error(apiError.message || t("Could not save the ministry."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="p-6 pb-5 flex-1 flex flex-col">
      <FormHero
        icon={Layers}
        title={editing ? t("Edit ministry") : t("New ministry")}
        subtitle={editing ? t("Edit ministry information.") : t("Register a team, its leaders and the scheduling rules.")}
        backHref={BACK}
        requiredNote={t("Required fields to save the ministry.")}
        onSave={handleSave}
        saving={saving}
        disabled={!name.trim()}
        saveLabel={editing ? t("Save changes") : t("Save ministry")}
      />

      <FormCard>
        <FormSection
          icon={Layers}
          title={t("Ministry information")}
          description={t("Essential ministry data and its leaders.")}
          required
          open={openSection === "info"}
          onToggle={() => toggleSection("info")}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
            <FormInput
              label={t("Ministry name")}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
              }}
              placeholder={t("Enter the ministry name")}
              error={errors.name}
              required
            />

            <FormSelect
              label={t("Status")}
              value={status}
              onChange={(value: string) => setStatus(value as "active" | "inactive")}
              placeholder={t("Select")}
              options={[
                { value: "active", label: t("Active") },
                { value: "inactive", label: t("Inactive") },
              ]}
            />

            <div className="md:col-span-2 flex flex-col gap-[6px] w-full">
              <label className="text-[13px] font-[600] text-[#4B5563]">{t("Description")}</label>
              <textarea
                value={description ?? ""}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder={t("What this team does and what is expected from who serves in it.")}
                className="w-full px-[12px] py-[10px] bg-white border border-[#E5E7EB] rounded-[8px] text-[13px] text-[#1A1A2E] placeholder-[#9CA3AF] outline-none transition-all focus:ring-1 focus:ring-[#6D28D9] focus:border-[#6D28D9] hover:border-[#D1D5DB] resize-y"
              />
            </div>

            <div className="flex flex-col gap-[6px] w-full">
              <span className="text-[13px] font-[600] text-[#4B5563]">{t("Identification color")}</span>
              <div className="flex items-center gap-2 h-[42px]">
                {COLORS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setColor(option)}
                    aria-label={option}
                    aria-pressed={color === option}
                    className={`w-7 h-7 rounded-full transition-transform motion-reduce:transition-none ${
                      color === option ? "ring-2 ring-offset-2 ring-[#1A1A2E] scale-110" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: option }}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-[6px] w-full">
              <FormSelect
                label={t("Leaders")}
                value=""
                onChange={(value: string) => {
                  if (value && !leaderIds.includes(value)) setLeaderIds([...leaderIds, value]);
                }}
                placeholder={t("Add leader")}
                searchable
                options={volunteers
                  .filter((v) => !leaderIds.includes(v.id))
                  .map((v) => ({ value: v.id, label: v.name }))}
              />
              {leaderIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {leaderIds.map((id) => {
                    const volunteer = volunteers.find((v) => v.id === id);
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 h-[26px] pl-2.5 pr-1.5 rounded-md bg-[#F4EEFF] border border-[#6D28D9]/20 text-[12px] font-semibold text-[#5B21B6]"
                      >
                        {volunteer?.name ?? id}
                        <button
                          type="button"
                          onClick={() => setLeaderIds(leaderIds.filter((x) => x !== id))}
                          className="p-0.5 rounded hover:bg-[#6D28D9]/10"
                          aria-label={t("Remove")}
                        >
                          <X className="w-3 h-3" strokeWidth={2.5} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </FormSection>

        <FormSection
          icon={SlidersHorizontal}
          title={t("Scheduling rules")}
          description={t("Defaults for this ministry. The volunteer's own preference wins.")}
          open={openSection === "rules"}
          onToggle={() => toggleSection("rules")}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
            <FormInput
              label={t("Confirmation deadline (hours)")}
              type="number"
              min={0}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
            <FormInput
              label={t("Minimum rest (days)")}
              type="number"
              min={0}
              value={minRest}
              onChange={(e) => setMinRest(e.target.value)}
            />
            <FormInput
              label={t("Maximum per month")}
              type="number"
              min={0}
              value={maxPerMonth}
              onChange={(e) => setMaxPerMonth(e.target.value)}
            />
          </div>
        </FormSection>
      </FormCard>
    </main>
  );
}
