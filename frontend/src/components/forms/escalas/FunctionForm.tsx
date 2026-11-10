"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ClipboardList, Award } from "lucide-react";
import FormInput from "@/components/ui/FormInput";
import FormSelect from "@/components/ui/FormSelect";
import BeautifulSwitch from "@/components/BeautifulSwitch";
import { FormCard, FormHero, FormSection } from "@/components/escalas/FormShell";
import { FunctionsService } from "@/services/functions.service";
import { MinistriesService } from "@/services/ministries.service";
import { SkillsService } from "@/services/skills.service";
import type { Ministry, MinistryFunction, Skill } from "@/types/escalas";

const BACK = "/functions";

export default function FunctionForm({
  fn,
  defaultMinistryId,
}: {
  fn?: MinistryFunction;
  defaultMinistryId?: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const editing = Boolean(fn);

  const [openSection, setOpenSection] = useState<string | null>("info");
  const toggleSection = (key: string) => setOpenSection((prev) => (prev === key ? null : key));

  const [ministryId, setMinistryId] = useState(fn?.ministry_id ?? defaultMinistryId ?? "");
  const [name, setName] = useState(fn?.name ?? "");
  const [description, setDescription] = useState(fn?.description ?? "");
  const [quantity, setQuantity] = useState(String(fn?.default_quantity ?? 1));
  const [isLeadership, setIsLeadership] = useState(fn?.is_leadership ?? false);
  const [status, setStatus] = useState<"active" | "inactive">(fn?.status ?? "active");
  const [skillIds, setSkillIds] = useState<string[]>(fn?.required_skill_ids ?? []);

  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    MinistriesService.list({ itemsPerPage: 200 }).then((r) => setMinistries(r.data ?? [])).catch(() => setMinistries([]));
    SkillsService.list({ itemsPerPage: 200 }).then((r) => setSkills(r.data ?? [])).catch(() => setSkills([]));
  }, []);

  const handleSave = async () => {
    setErrors({});

    const nextErrors: Record<string, string> = {};
    if (!ministryId) nextErrors.ministry_id = t("Required field");
    if (!name.trim()) nextErrors.name = t("Required field");

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setOpenSection("info");
      return;
    }

    setSaving(true);

    const payload = {
      ministry_id: ministryId,
      name: name.trim(),
      description: description?.trim() || null,
      default_quantity: Number(quantity) || 1,
      is_leadership: isLeadership,
      status,
      required_skill_ids: skillIds,
    };

    try {
      const res = editing && fn
        ? await FunctionsService.update(fn.id, payload)
        : await FunctionsService.create(payload);
      toast.success(res.message);
      router.push(`/ministries/${ministryId}`);
      router.refresh();
    } catch (err) {
      const apiError = err as Error & { errors?: Record<string, string[]> };
      setErrors(Object.fromEntries(Object.entries(apiError.errors ?? {}).map(([k, v]) => [k, v[0]])));
      toast.error(apiError.message || t("Could not save the function."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="p-6 pb-5 flex-1 flex flex-col">
      <FormHero
        icon={ClipboardList}
        title={editing ? t("Edit function") : t("New function")}
        subtitle={t("Define the role and how many people it takes per schedule.")}
        backHref={BACK}
        requiredNote={t("Required fields to save the function.")}
        onSave={handleSave}
        saving={saving}
        disabled={!name.trim() || !ministryId}
        saveLabel={editing ? t("Save changes") : t("Save function")}
      />

      <FormCard>
        <FormSection
          icon={ClipboardList}
          title={t("Function information")}
          description={t("Which ministry it belongs to and how many people it fills.")}
          required
          open={openSection === "info"}
          onToggle={() => toggleSection("info")}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
            <FormSelect
              label={t("Ministry")}
              value={ministryId}
              onChange={(value: string) => {
                setMinistryId(value);
                if (errors.ministry_id) setErrors((prev) => ({ ...prev, ministry_id: "" }));
              }}
              placeholder={t("Select the ministry")}
              searchable
              error={errors.ministry_id}
              required
              options={ministries.map((m) => ({ value: m.id, label: m.name }))}
            />

            <FormInput
              label={t("Function name")}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
              }}
              placeholder={t("Lead vocal, sound engineer…")}
              error={errors.name}
              required
            />

            <div className="md:col-span-2 flex flex-col gap-[6px] w-full">
              <label className="text-[13px] font-[600] text-[#4B5563]">{t("Description")}</label>
              <textarea
                value={description ?? ""}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-[12px] py-[10px] bg-white border border-[#E5E7EB] rounded-[8px] text-[13px] text-[#1A1A2E] placeholder-[#9CA3AF] outline-none transition-all focus:ring-1 focus:ring-[#6D28D9] focus:border-[#6D28D9] hover:border-[#D1D5DB] resize-y"
              />
            </div>

            <FormInput
              label={t("People per schedule")}
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
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

            <div className="md:col-span-2 flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-white px-4 py-3">
              <div>
                <p className="text-[13px] font-[600] text-[#1A1A2E]">{t("Leadership function")}</p>
                <p className="text-[11px] text-[#6B7280]">{t("Appears first on the schedule and marks who is in charge.")}</p>
              </div>
              <BeautifulSwitch checked={isLeadership} onChange={() => setIsLeadership((v) => !v)} />
            </div>
          </div>
        </FormSection>

        <FormSection
          icon={Award}
          title={t("Required skills")}
          description={t("Who lacks a skill shows a warning, never a hard block.")}
          open={openSection === "skills"}
          onToggle={() => toggleSection("skills")}
        >
          <div className="grid grid-cols-1 gap-6 mb-2">
            <FormSelect
              label={t("Skills")}
              value={skillIds}
              onChange={(value: string[]) => setSkillIds(value)}
              placeholder={t("No skill required")}
              multiple
              searchable
              options={skills.map((s) => ({ value: s.id, label: s.name }))}
            />
          </div>
        </FormSection>
      </FormCard>
    </main>
  );
}
