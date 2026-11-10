"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
import { SystemUsersService } from "@/services/system-users.service";
import { VolunteersService } from "@/services/volunteers.service";
import type { Volunteer } from "@/types/escalas";
import { ROLE_LABELS } from "@/lib/escalas-format";

export interface SystemUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: string;
  status?: string;
  phone?: string | null;
  volunteer_id?: string | null;
}

/**
 * Usuário do sistema = acesso. O vínculo com um voluntário é o que permite
 * ao próprio usuário confirmar presença e pedir troca pela área "Minhas escalas".
 */
export default function SystemUserForm({ user }: { user?: SystemUser }) {
  const router = useRouter();
  const editing = Boolean(user);

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(user?.role ?? "volunteer");
  const [status, setStatus] = useState(user?.status ?? "active");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [volunteerId, setVolunteerId] = useState(user?.volunteer_id ?? "");

  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    VolunteersService.list({ itemsPerPage: 300 })
      .then((res) => setVolunteers(res.data ?? []))
      .catch(() => setVolunteers([]));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);

    const payload: Record<string, unknown> = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      status,
      phone: phone?.trim() || null,
      volunteer_id: volunteerId || null,
    };

    if (password) payload.password = password;

    try {
      const res = editing && user
        ? await SystemUsersService.update(user.id, payload)
        : await SystemUsersService.create(payload);
      toast.success((res as { message: string }).message);
      router.push("/systemUsers");
      router.refresh();
    } catch (err) {
      const apiError = err as Error & { errors?: Record<string, string[]> };
      setErrors(apiError.errors ?? {});
      toast.error(apiError.message || "Não foi possível salvar o usuário.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-[6px]">
          <label htmlFor="u-name" className="text-[13px] font-[600] text-[#4B5563]">
            Nome <span className="text-[#EF4444] ml-0.5">*</span>
          </label>
          <input
            id="u-name"
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
          <label htmlFor="u-email" className="text-[13px] font-[600] text-[#4B5563]">
            E-mail <span className="text-[#EF4444] ml-0.5">*</span>
          </label>
          <input
            id="u-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`h-[42px] px-3 rounded-lg border text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9] ${
              errors.email ? "border-[#EF4444]" : "border-[#E5E7EB]"
            }`}
            required
          />
          {errors.email && <span className="text-[11px] text-[#EF4444]">{errors.email[0]}</span>}
        </div>

        <div className="flex flex-col gap-[6px]">
          <label htmlFor="u-password" className="text-[13px] font-[600] text-[#4B5563]">
            Senha {!editing && <span className="text-[#EF4444] ml-0.5">*</span>}
          </label>
          <input
            id="u-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={editing ? "Deixe em branco para manter" : "Mínimo de 8 caracteres"}
            minLength={8}
            required={!editing}
            className={`h-[42px] px-3 rounded-lg border text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9] ${
              errors.password ? "border-[#EF4444]" : "border-[#E5E7EB]"
            }`}
          />
          {errors.password && <span className="text-[11px] text-[#EF4444]">{errors.password[0]}</span>}
        </div>

        <div className="flex flex-col gap-[6px]">
          <label htmlFor="u-phone" className="text-[13px] font-[600] text-[#4B5563]">Telefone</label>
          <input
            id="u-phone"
            value={phone ?? ""}
            onChange={(e) => setPhone(e.target.value)}
            className="h-[42px] px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
          />
        </div>

        <div className="flex flex-col gap-[6px]">
          <label className="text-[13px] font-[600] text-[#4B5563]">
            Papel <span className="text-[#EF4444] ml-0.5">*</span>
          </label>
          <CustomSelect
            value={role}
            onChange={(value: string) => setRole(value)}
            className="h-[42px]"
            options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </div>

        <div className="flex flex-col gap-[6px]">
          <label className="text-[13px] font-[600] text-[#4B5563]">Situação</label>
          <CustomSelect
            value={status}
            onChange={(value: string) => setStatus(value)}
            className="h-[42px]"
            options={[
              { value: "active", label: "Ativo" },
              { value: "inactive", label: "Inativo" },
            ]}
          />
        </div>

        <div className="flex flex-col gap-[6px] md:col-span-2">
          <label className="text-[13px] font-[600] text-[#4B5563]">Voluntário vinculado</label>
          <CustomSelect
            value={volunteerId}
            onChange={(value: string) => setVolunteerId(value)}
            placeholder="Nenhum"
            searchable
            isClearable
            className="h-[42px]"
            options={volunteers.map((v) => ({ value: v.id, label: v.name }))}
          />
          <span className="text-[11px] text-[#9CA3AF]">
            Sem vínculo, o usuário não vê a própria agenda nem confirma presença.
          </span>
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
          disabled={saving || !name.trim() || !email.trim()}
          className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[#6D28D9] text-white text-[13px] font-semibold hover:bg-[#5B21B6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <Save className="w-4 h-4" strokeWidth={2.4} />
          {saving ? "Salvando…" : editing ? "Salvar alterações" : "Criar usuário"}
        </button>
      </div>
    </form>
  );
}
