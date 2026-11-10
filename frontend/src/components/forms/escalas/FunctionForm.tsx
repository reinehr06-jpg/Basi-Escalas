"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
import BeautifulSwitch from "@/components/BeautifulSwitch";
import { FunctionsService } from "@/services/functions.service";
import { MinistriesService } from "@/services/ministries.service";
import { SkillsService } from "@/services/skills.service";
import type { Ministry, MinistryFunction, Skill } from "@/types/escalas";

interface Props {
  fn?: MinistryFunction;
  defaultMinistryId?: string;
}

export default function FunctionForm({ fn, defaultMinistryId }: Props) {
  const router = useRouter();
  const editing = Boolean(fn);

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
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    MinistriesService.list({ itemsPerPage: 200 })
      .then((res) => setMinistries(res.data ?? []))
      .catch(() => setMinistries([]));
    SkillsService.list({ itemsPerPage: 200 })
      .then((res) => setSkills(res.data ?? []))
      .catch(() => setSkills([]));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);

    const payload = {
      ministry_id: ministryId,
      name: name.trim(),
      description: description.trim() || null,
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
      setErrors(apiError.errors ?? {});
      toast.error(apiError.message || "Não foi possível salvar a função.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-[6px]">
          <label className="text-[13px] font-[600] text-[#4B5563]">
            Ministério <span className="text-[#EF4444] ml-0.5">*</span>
          </label>
          <CustomSelect
            value={ministryId}
            onChange={(value: string) => setMinistryId(value)}
            placeholder="Selecione o ministério"
            searchable
            className="h-[42px]"
            error={Boolean(errors.ministry_id)}
            options={ministries.map((m) => ({ value: m.id, label: m.name }))}
          />
          {errors.ministry_id && <span className="text-[11px] text-[#EF4444]">{errors.ministry_id[0]}</span>}
        </div>

        <div className="flex flex-col gap-[6px]">
          <label htmlFor="fn-name" className="text-[13px] font-[600] text-[#4B5563]">
            Nome da função <span className="text-[#EF4444] ml-0.5">*</span>
          </label>
          <input
            id="fn-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Vocal principal, Operador de som…"
            className={`h-[42px] px-3 rounded-lg border text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9] ${
              errors.name ? "border-[#EF4444]" : "border-[#E5E7EB]"
            }`}
            required
          />
          {errors.name && <span className="text-[11px] text-[#EF4444]">{errors.name[0]}</span>}
        </div>

        <div className="flex flex-col gap-[6px] md:col-span-2">
          <label htmlFor="fn-description" className="text-[13px] font-[600] text-[#4B5563]">Descrição</label>
          <textarea
            id="fn-description"
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="px-3 py-2.5 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9] resize-y"
          />
        </div>

        <div className="flex flex-col gap-[6px]">
          <label htmlFor="fn-qty" className="text-[13px] font-[600] text-[#4B5563]">Pessoas por escala</label>
          <input
            id="fn-qty"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="h-[42px] px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
          />
          <span className="text-[11px] text-[#9CA3AF]">Quantidade sugerida ao criar uma escala nova.</span>
        </div>

        <div className="flex flex-col gap-[6px]">
          <label className="text-[13px] font-[600] text-[#4B5563]">Situação</label>
          <CustomSelect
            value={status}
            onChange={(value: string) => setStatus(value as "active" | "inactive")}
            placeholder="Selecione"
            className="h-[42px]"
            options={[
              { value: "active", label: "Ativa" },
              { value: "inactive", label: "Inativa" },
            ]}
          />
        </div>

        <div className="flex flex-col gap-[6px] md:col-span-2">
          <label className="text-[13px] font-[600] text-[#4B5563]">Habilidades exigidas</label>
          <CustomSelect
            value={skillIds}
            onChange={(value: string[]) => setSkillIds(value)}
            placeholder="Nenhuma habilidade exigida"
            multiple
            searchable
            className="h-[42px]"
            options={skills.map((s) => ({ value: s.id, label: s.name }))}
          />
          <span className="text-[11px] text-[#9CA3AF]">
            Quem não tiver a habilidade aparece com alerta na hora de escalar, sem ser bloqueado.
          </span>
        </div>

        <div className="md:col-span-2 flex items-center justify-between rounded-lg border border-[#E5E7EB] px-4 py-3">
          <div>
            <p className="text-[13px] font-[600] text-[#1A1A2E]">Função de liderança</p>
            <p className="text-[11px] text-[#6B7280]">Aparece primeiro na escala e indica o responsável do dia.</p>
          </div>
          <BeautifulSwitch checked={isLeadership} onChange={() => setIsLeadership((v) => !v)} />
        </div>
      </div>

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
          disabled={saving || !name.trim() || !ministryId}
          className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[#6D28D9] text-white text-[13px] font-semibold hover:bg-[#5B21B6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <Save className="w-4 h-4" strokeWidth={2.4} />
          {saving ? "Salvando…" : editing ? "Salvar alterações" : "Criar função"}
        </button>
      </div>
    </form>
  );
}
