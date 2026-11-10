"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CalendarDays, Repeat } from "lucide-react";
import FormInput from "@/components/ui/FormInput";
import FormSelect from "@/components/ui/FormSelect";
import { FormCard, FormHero, FormSection } from "@/components/escalas/FormShell";
import { EventsService } from "@/services/events.service";
import { MinistriesService } from "@/services/ministries.service";
import type { CalendarEvent, Ministry } from "@/types/escalas";
import { EVENT_TYPE_LABELS, toInputDateTime } from "@/lib/escalas-format";
import { WEEKDAYS } from "@/types/escalas";

const BACK = "/events";

export default function EventForm({ event }: { event?: CalendarEvent }) {
  const { t } = useTranslation();
  const router = useRouter();
  const editing = Boolean(event);

  const [openSection, setOpenSection] = useState<string | null>("info");
  const toggleSection = (key: string) => setOpenSection((prev) => (prev === key ? null : key));

  const [title, setTitle] = useState(event?.title ?? "");
  const [type, setType] = useState(event?.type ?? "service");
  const [startsAt, setStartsAt] = useState(toInputDateTime(event?.starts_at));
  const [endsAt, setEndsAt] = useState(toInputDateTime(event?.ends_at));
  const [location, setLocation] = useState(event?.location ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [ministryIds, setMinistryIds] = useState<string[]>(event?.ministry_ids ?? []);

  const [frequency, setFrequency] = useState<"none" | "weekly" | "monthly">("none");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [until, setUntil] = useState("");

  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    MinistriesService.list({ itemsPerPage: 200, status: "active" })
      .then((r) => setMinistries(r.data ?? []))
      .catch(() => setMinistries([]));
  }, []);

  const handleSave = async () => {
    setErrors({});

    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = t("Required field");
    if (!startsAt) nextErrors.starts_at = t("Required field");

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setOpenSection("info");
      return;
    }

    setSaving(true);

    const payload: Record<string, unknown> = {
      title: title.trim(),
      type,
      starts_at: startsAt,
      ends_at: endsAt || null,
      location: location?.trim() || null,
      description: description?.trim() || null,
      ministry_ids: ministryIds,
    };

    // Recorrência só vale na criação: editar uma série usa `scope`.
    if (!editing && frequency !== "none") {
      payload.recurrence = {
        frequency,
        interval: 1,
        weekdays: frequency === "weekly" ? weekdays : [],
        until: until || null,
      };
    }

    try {
      const res = editing && event
        ? await EventsService.update(event.id, payload)
        : await EventsService.create(payload as never);
      toast.success(res.message);
      router.push(`/events/${res.item.id}`);
      router.refresh();
    } catch (err) {
      const apiError = err as Error & { errors?: Record<string, string[]> };
      setErrors(Object.fromEntries(Object.entries(apiError.errors ?? {}).map(([k, v]) => [k, v[0]])));
      toast.error(apiError.message || t("Could not save the event."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="p-6 pb-5 flex-1 flex flex-col">
      <FormHero
        icon={CalendarDays}
        title={editing ? t("Edit event") : t("New event")}
        subtitle={t("Service, rehearsal or event that will receive a schedule.")}
        backHref={BACK}
        requiredNote={t("Required fields to save the event.")}
        onSave={handleSave}
        saving={saving}
        disabled={!title.trim() || !startsAt}
        saveLabel={editing ? t("Save changes") : t("Save event")}
      />

      <FormCard>
        <FormSection
          icon={CalendarDays}
          title={t("Event information")}
          description={t("When it happens, where, and which ministries take part.")}
          required
          open={openSection === "info"}
          onToggle={() => toggleSection("info")}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
            <div className="md:col-span-2">
              <FormInput
                label={t("Title")}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
                }}
                placeholder={t("Celebration Service")}
                error={errors.title}
                required
              />
            </div>

            <FormSelect
              label={t("Type")}
              value={type}
              onChange={(value: string) => setType(value as typeof type)}
              placeholder={t("Select")}
              options={Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
            />

            <FormInput
              label={t("Location")}
              value={location ?? ""}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("Main building")}
            />

            <FormInput
              label={t("Start")}
              type="datetime-local"
              value={startsAt}
              onChange={(e) => {
                setStartsAt(e.target.value);
                if (errors.starts_at) setErrors((prev) => ({ ...prev, starts_at: "" }));
              }}
              error={errors.starts_at}
              required
            />

            <FormInput
              label={t("End")}
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />

            <div className="md:col-span-2">
              <FormSelect
                label={t("Ministries involved")}
                value={ministryIds}
                onChange={(value: string[]) => setMinistryIds(value)}
                placeholder={t("Select the ministries")}
                multiple
                searchable
                options={ministries.map((m) => ({ value: m.id, label: m.name }))}
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-[6px] w-full">
              <label className="text-[13px] font-[600] text-[#4B5563]">{t("Notes")}</label>
              <textarea
                value={description ?? ""}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-[12px] py-[10px] bg-white border border-[#E5E7EB] rounded-[8px] text-[13px] text-[#1A1A2E] placeholder-[#9CA3AF] outline-none transition-all focus:ring-1 focus:ring-[#6D28D9] focus:border-[#6D28D9] hover:border-[#D1D5DB] resize-y"
              />
            </div>
          </div>
        </FormSection>

        {!editing && (
          <FormSection
            icon={Repeat}
            title={t("Repetition")}
            description={t("Each occurrence becomes its own event, with independent schedule and confirmations.")}
            open={openSection === "recurrence"}
            onToggle={() => toggleSection("recurrence")}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
              <FormSelect
                label={t("Frequency")}
                value={frequency}
                onChange={(value: string) => setFrequency(value as typeof frequency)}
                placeholder={t("Does not repeat")}
                options={[
                  { value: "none", label: t("Does not repeat") },
                  { value: "weekly", label: t("Weekly") },
                  { value: "monthly", label: t("Monthly") },
                ]}
              />

              {frequency !== "none" && (
                <FormInput
                  label={t("Repeat until")}
                  type="date"
                  value={until}
                  onChange={(e) => setUntil(e.target.value)}
                />
              )}

              {frequency === "weekly" && (
                <div className="md:col-span-2 flex flex-col gap-[6px] w-full">
                  <span className="text-[13px] font-[600] text-[#4B5563]">{t("Days of the week")}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {WEEKDAYS.map((label, index) => {
                      const active = weekdays.includes(index);
                      return (
                        <button
                          key={label}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setWeekdays(active ? weekdays.filter((d) => d !== index) : [...weekdays, index])}
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
              )}
            </div>
          </FormSection>
        )}
      </FormCard>
    </main>
  );
}
