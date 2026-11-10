"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { UsersRound, ShieldCheck } from "lucide-react";
import FormInput from "@/components/ui/FormInput";
import FormSelect from "@/components/ui/FormSelect";
import { FormCard, FormHero, FormSection } from "@/components/escalas/FormShell";
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

const BACK = "/systemUsers";

/**
 * Usuário do sistema = acesso. O vínculo com um voluntário é o que permite
 * ao próprio usuário confirmar presença e pedir troca pela área "Minhas escalas".
 */
export default function SystemUserForm({ user }: { user?: SystemUser }) {
  const { t } = useTranslation();
  const router = useRouter();
  const editing = Boolean(user);

  const [openSection, setOpenSection] = useState<string | null>("access");
  const toggleSection = (key: string) => setOpenSection((prev) => (prev === key ? null : key));

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(user?.role ?? "volunteer");
  const [status, setStatus] = useState(user?.status ?? "active");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [volunteerId, setVolunteerId] = useState(user?.volunteer_id ?? "");

  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    VolunteersService.list({ itemsPerPage: 300 })
      .then((res) => setVolunteers(res.data ?? []))
      .catch(() => setVolunteers([]));
  }, []);

  const handleSave = async () => {
    setErrors({});

    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = t("Required field");
    if (!email.trim()) nextErrors.email = t("Required field");
    if (!editing && password.length < 8) nextErrors.password = t("At least 8 characters");

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setOpenSection("access");
      return;
    }

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
      toast.success(res.message);
      router.push(BACK);
      router.refresh();
    } catch (err) {
      const apiError = err as Error & { errors?: Record<string, string[]> };
      setErrors(Object.fromEntries(Object.entries(apiError.errors ?? {}).map(([k, v]) => [k, v[0]])));
      toast.error(apiError.message || t("Could not save the user."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="p-6 pb-5 flex-1 flex flex-col">
      <FormHero
        icon={UsersRound}
        title={editing ? t("Edit user") : t("New user")}
        subtitle={t("Set the role and link the access to a volunteer record.")}
        backHref={BACK}
        requiredNote={t("Required fields to save the user.")}
        onSave={handleSave}
        saving={saving}
        disabled={!name.trim() || !email.trim()}
        saveLabel={editing ? t("Save changes") : t("Save user")}
      />

      <FormCard>
        <FormSection
          icon={UsersRound}
          title={t("Access data")}
          description={t("How the person signs in to the system.")}
          required
          open={openSection === "access"}
          onToggle={() => toggleSection("access")}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
            <FormInput
              label={t("Name")}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
              }}
              error={errors.name}
              required
            />
            <FormInput
              label={t("Email")}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
              }}
              error={errors.email}
              required
            />
            <FormInput
              label={t("Password")}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
              }}
              placeholder={editing ? t("Leave blank to keep") : t("At least 8 characters")}
              error={errors.password}
              required={!editing}
            />
            <FormInput
              label={t("Phone")}
              value={phone ?? ""}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </FormSection>

        <FormSection
          icon={ShieldCheck}
          title={t("Role and link")}
          description={t("What the user can see and whose schedule belongs to them.")}
          open={openSection === "role"}
          onToggle={() => toggleSection("role")}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
            <FormSelect
              label={t("Role")}
              value={role}
              onChange={(value: string) => setRole(value)}
              placeholder={t("Select")}
              required
              options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))}
            />
            <FormSelect
              label={t("Status")}
              value={status}
              onChange={(value: string) => setStatus(value)}
              placeholder={t("Select")}
              options={[
                { value: "active", label: t("Active") },
                { value: "inactive", label: t("Inactive") },
              ]}
            />
            <div className="md:col-span-2 flex flex-col gap-[6px]">
              <FormSelect
                label={t("Linked volunteer")}
                value={volunteerId}
                onChange={(value: string) => setVolunteerId(value)}
                placeholder={t("None")}
                searchable
                options={volunteers.map((v) => ({ value: v.id, label: v.name }))}
              />
              <span className="text-[11px] text-[#9CA3AF]">
                {t("Without a link, the user has no personal schedule and cannot confirm attendance.")}
              </span>
            </div>
          </div>
        </FormSection>
      </FormCard>
    </main>
  );
}
