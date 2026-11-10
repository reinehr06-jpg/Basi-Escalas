"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { SlidersHorizontal, Save, RotateCcw } from "lucide-react";
import DetailHero from "@/components/escalas/DetailHero";
import BeautifulSwitch from "@/components/BeautifulSwitch";
import { EscalasSettingsService } from "@/services/escalas-settings.service";
import type { SettingRow } from "@/types/escalas";

const LABELS: Record<string, { label: string; hint: string }> = {
  "scheduling.confirmation_deadline_hours": { label: "Confirmation deadline (hours)", hint: "Before the event, when the ministry does not set its own." },
  "scheduling.min_rest_days": { label: "Minimum rest between schedules (days)", hint: "Below that, the candidate shows a warning." },
  "scheduling.max_per_month": { label: "Maximum schedules per month", hint: "Default cap per volunteer." },
  "scheduling.allow_self_swap": { label: "Volunteer can request a swap", hint: "If off, only leadership opens requests." },
  "scheduling.require_leader_approval_on_swap": { label: "Swap requires leadership approval", hint: "Recommended: avoids uncontrolled swaps." },
  "scheduling.block_without_required_skill": { label: "Block without the required skill", hint: "When on, it becomes a blocker instead of a warning." },
  "automation.reminder_offsets_hours": { label: "Reminders (hours before)", hint: "Comma separated list, e.g. 72, 24, 3." },
  "automation.auto_close_schedule_after_hours": { label: "Close schedule after (hours)", hint: "After the event." },
  "automation.auto_release_on_absence": { label: "Free slots when approving an absence", hint: "The assignments in the period open up again." },
  "automation.escalate_unconfirmed_hours": { label: "Warn leadership if not confirmed within (hours)", hint: "Counted from the publication." },
  "checkin.open_minutes_before": { label: "Open check-in (minutes before)", hint: "Window in which attendance can be marked." },
  "checkin.allow_self_checkin": { label: "Volunteer does their own check-in", hint: "Otherwise, only leadership marks it." },
  "checkin.mark_absent_after_minutes": { label: "Mark as absent after (minutes)", hint: "Time after the start without check-in." },
};

const GROUPS: Record<string, string> = {
  scheduling: "Schedule building",
  automation: "Automations",
  checkin: "Check-in",
};

/** Módulo 16 — configurações e automações. */
export default function SchedulingSettingsPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<SettingRow[]>([]);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await EscalasSettingsService.list();
      setRows(res.data ?? []);
      setValues(Object.fromEntries((res.data ?? []).map((row) => [row.key, row.value])));
    } catch (err) {
      toast.error((err as Error).message || t("Could not load the settings."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = rows.some((row) => JSON.stringify(values[row.key]) !== JSON.stringify(row.value));

  const save = async () => {
    setSaving(true);
    try {
      const changed = Object.fromEntries(
        rows
          .filter((row) => JSON.stringify(values[row.key]) !== JSON.stringify(row.value))
          .map((row) => [row.key, values[row.key]]),
      );
      const res = await EscalasSettingsService.update(changed);
      toast.success(res.message);
      load();
    } catch (err) {
      toast.error((err as Error).message || t("Could not save."));
    } finally {
      setSaving(false);
    }
  };

  const grouped = rows.reduce<Record<string, SettingRow[]>>((acc, row) => {
    (acc[row.group] ??= []).push(row);
    return acc;
  }, {});

  return (
    <main className="p-4 md:py-5 px-4 md:px-8 flex-1 flex flex-col max-w-screen-2xl mx-auto w-full">
      <DetailHero
        icon={SlidersHorizontal}
        breadcrumb={{ label: t("Settings"), href: "/settings" }}
        title={t("Rules and automations")}
        subtitle={t("System defaults. Each ministry may have its own values.")}
        backHref="/settings"
        backTitle={t("Back to Settings")}
        actions={
          dirty ? (
            <button
              onClick={save}
              disabled={saving}
              className="h-[38px] px-3.5 sm:px-4 bg-white hover:bg-purple-50 text-[#6D28D9] font-bold text-xs sm:text-sm rounded-[10px] transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5 text-[#6D28D9]" strokeWidth={2.4} />
              <span>{saving ? t("Saving...") : t("Save changes")}</span>
            </button>
          ) : undefined
        }
      />

      <div className="bg-white rounded-2xl flex-1 border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-10 text-center text-sm text-[#6B7280]">{t("Loading...")}</div>
        ) : (
          <div className="p-6 flex flex-col gap-6">
            {Object.entries(grouped).map(([group, groupRows]) => (
              <section key={group}>
                <h2 className="text-[13px] font-bold text-[#1A1A2E] mb-3">{t(GROUPS[group] ?? group)}</h2>
                <div className="flex flex-col gap-3">
                  {groupRows.map((row) => {
                    const meta = LABELS[row.key] ?? { label: row.key, hint: "" };
                    const current = values[row.key];
                    const isBool = typeof row.default === "boolean";
                    const isList = Array.isArray(row.default);

                    return (
                      <div key={row.key} className="flex items-center justify-between gap-4 rounded-xl border border-[#E5E7EB] px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-[13px] font-[600] text-[#1A1A2E]">{t(meta.label)}</p>
                          {meta.hint && <p className="text-[11px] text-[#6B7280] mt-0.5">{t(meta.hint)}</p>}
                        </div>

                        {isBool ? (
                          <BeautifulSwitch
                            checked={Boolean(current)}
                            onChange={() => setValues((v) => ({ ...v, [row.key]: !current }))}
                          />
                        ) : isList ? (
                          <input
                            value={Array.isArray(current) ? current.join(", ") : String(current ?? "")}
                            onChange={(e) =>
                              setValues((v) => ({
                                ...v,
                                [row.key]: e.target.value
                                  .split(",")
                                  .map((part) => Number(part.trim()))
                                  .filter((n) => !Number.isNaN(n)),
                              }))
                            }
                            aria-label={t(meta.label)}
                            className="w-[160px] h-9 px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] text-right outline-none focus:border-[#6D28D9] shrink-0"
                          />
                        ) : (
                          <input
                            type="number"
                            min={0}
                            value={String(current ?? "")}
                            onChange={(e) => setValues((v) => ({ ...v, [row.key]: Number(e.target.value) }))}
                            aria-label={t(meta.label)}
                            className="w-[100px] h-9 px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] text-right outline-none focus:border-[#6D28D9] shrink-0"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}

            {dirty && (
              <button
                onClick={() => setValues(Object.fromEntries(rows.map((row) => [row.key, row.value])))}
                className="self-start inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#6B7280] hover:text-[#1A1A2E] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />{t("Discard changes")}</button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
