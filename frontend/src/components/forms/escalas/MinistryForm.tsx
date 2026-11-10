"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, X } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
import { MinistriesService } from "@/services/ministries.service";
import { VolunteersService } from "@/services/volunteers.service";
import type { Ministry, Volunteer } from "@/types/escalas";

const COLORS = ["#6D28D9", "#0EA5E9", "#F59E0B", "#EC4899", "#10B981", "#6366F1", "#EF4444", "#0F172A"];

interface Props {
  ministry?: Ministry;
}

export default function MinistryForm({ ministry }: Props) {
  const router = useRouter();
  const editing = Boolean(ministry);

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
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    VolunteersService.list({ itemsPerPage: 200, status: "active" })
      .then((res) => setVolunteers(res.data ?? []))
      .catch(() => setVolunteers([]));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
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
      if (editing && ministry) {
        await MinistriesService.update(ministry.id, payload);
        toast.success("Ministério atualizado com sucesso!");
        router.push(`/ministries/${ministry.id}`);
      } else {
        const res = await MinistriesService.create(payload);
        toast.success(res.message);
        router.push(`/ministries/${res.item.id}`);
      }
      router.refresh();
    } catch (err) {
      const apiError = err as Error & { errors?: Record<string, string[]> };
      setErrors(apiError.errors ?? {});
      toast.error(apiError.message || "Não foi possível salvar o ministério.");
    } finally {
      setSaving(false);
    }
  };

  const fieldError = (key: string) => errors[key]?.[0];

  return (
    <form onSubmit={submit} className="flex flex-col gap-6 p-6">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-[6px] md:col-span-2">
          <label htmlFor="ministry-name" className="text-[13px] font-[600] text-[#4B5563]">
            Nome <span className="text-[#EF4444] ml-0.5">*</span>
          </label>
          <input
            id="ministry-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Louvor, Mídia, Recepção…"
            className={`h-[42px] px-3 rounded-lg border text-[13px] text-[#1A1A2E] outline-none transition-colors focus:border-[#6D28D9] ${
              fieldError("name") ? "border-[#EF4444]" : "border-[#E5E7EB]"
            }`}
            required
          />
          {fieldError("name") && <span className="text-[11px] text-[#EF4444]">{fieldError("name")}</span>}
        </div>

        <div className="flex flex-col gap-[6px] md:col-span-2">
          <label htmlFor="ministry-description" className="text-[13px] font-[600] text-[#4B5563]">Descrição</label>
          <textarea
            id="ministry-description"
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="O que essa equipe faz e o que se espera de quem serve nela."
            className="px-3 py-2.5 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none transition-colors focus:border-[#6D28D9] resize-y"
          />
        </div>

        <div className="flex flex-col gap-[6px]">
          <span className="text-[13px] font-[600] text-[#4B5563]">Cor de identificação</span>
          <div className="flex items-center gap-2 h-[42px]">
            {COLORS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setColor(option)}
                aria-label={`Cor ${option}`}
                aria-pressed={color === option}
                className={`w-7 h-7 rounded-full transition-transform motion-reduce:transition-none ${
                  color === option ? "ring-2 ring-offset-2 ring-[#1A1A2E] scale-110" : "hover:scale-105"
                }`}
                style={{ backgroundColor: option }}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-[6px]">
          <label className="text-[13px] font-[600] text-[#4B5563]">Situação</label>
          <CustomSelect
            value={status}
            onChange={(value: string) => setStatus(value as "active" | "inactive")}
            placeholder="Selecione"
            className="h-[42px]"
            options={[
              { value: "active", label: "Ativo" },
              { value: "inactive", label: "Inativo" },
            ]}
          />
        </div>

        <div className="flex flex-col gap-[6px] md:col-span-2">
          <label className="text-[13px] font-[600] text-[#4B5563]">Líderes</label>
          <CustomSelect
            value=""
            onChange={(value: string) => {
              if (value && !leaderIds.includes(value)) setLeaderIds([...leaderIds, value]);
            }}
            placeholder="Adicionar líder"
            searchable
            className="h-[42px]"
            options={volunteers
              .filter((v) => !leaderIds.includes(v.id))
              .map((v) => ({ value: v.id, label: v.name }))}
          />
          {leaderIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {leaderIds.map((id) => {
                const volunteer = volunteers.find((v) => v.id === id);
                return (
                  <span key={id} className="inline-flex items-center gap-1.5 h-[26px] pl-2.5 pr-1.5 rounded-md bg-[#F4EEFF] border border-[#6D28D9]/20 text-[12px] font-semibold text-[#5B21B6]">
                    {volunteer?.name ?? id}
                    <button
                      type="button"
                      onClick={() => setLeaderIds(leaderIds.filter((x) => x !== id))}
                      className="p-0.5 rounded hover:bg-[#6D28D9]/10"
                      aria-label={`Remover ${volunteer?.name ?? "líder"}`}
                    >
                      <X className="w-3 h-3" strokeWidth={2.5} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-[13px] font-bold text-[#1A1A2E]">Regras de escala</h2>
        <p className="text-[11px] text-[#6B7280] mt-0.5 mb-3">
          Valem como padrão deste ministério. A preferência individual do voluntário tem prioridade.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { id: "deadline", label: "Prazo de confirmação (horas)", value: deadline, set: setDeadline, hint: "Antes do evento" },
            { id: "rest", label: "Folga mínima (dias)", value: minRest, set: setMinRest, hint: "Entre duas escalas" },
            { id: "max", label: "Máximo por mês", value: maxPerMonth, set: setMaxPerMonth, hint: "Escalas por voluntário" },
          ].map((field) => (
            <div key={field.id} className="flex flex-col gap-[6px]">
              <label htmlFor={field.id} className="text-[13px] font-[600] text-[#4B5563]">{field.label}</label>
              <input
                id={field.id}
                type="number"
                min={0}
                value={field.value}
                onChange={(e) => field.set(e.target.value)}
                className="h-[42px] px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
              />
              <span className="text-[11px] text-[#9CA3AF]">{field.hint}</span>
            </div>
          ))}
        </div>
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
          {saving ? "Salvando…" : editing ? "Salvar alterações" : "Criar ministério"}
        </button>
      </div>
    </form>
  );
}
