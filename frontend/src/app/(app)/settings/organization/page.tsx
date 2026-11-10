"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Building2, Save } from "lucide-react";
import DetailHero from "@/components/escalas/DetailHero";
import CustomSelect from "@/components/CustomSelect";
import { EscalasSettingsService } from "@/services/escalas-settings.service";

const TIMEZONES = [
  "America/Sao_Paulo", "America/Manaus", "America/Belem", "America/Fortaleza",
  "America/Recife", "America/Cuiaba", "America/Porto_Velho", "America/Rio_Branco",
];

export default function OrganizationSettingsPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", document: "", timezone: "America/Sao_Paulo", locale: "pt-BR",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    EscalasSettingsService.list()
      .then((res) => {
        const org = (res.organization ?? {}) as Record<string, string | null>;
        setForm({
          name: org.name ?? "",
          email: org.email ?? "",
          phone: org.phone ?? "",
          document: org.document ?? "",
          timezone: org.timezone ?? "America/Sao_Paulo",
          locale: org.locale ?? "pt-BR",
        });
      })
      .catch((err) => toast.error(err.message || "Não foi possível carregar os dados."))
      .finally(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await EscalasSettingsService.updateOrganization({
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        document: form.document.trim() || null,
        timezone: form.timezone,
        locale: form.locale,
      });
      toast.success(res.message);
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="p-4 md:py-5 px-4 md:px-8 flex-1 flex flex-col max-w-screen-2xl mx-auto w-full">
      <DetailHero
        icon={Building2}
        breadcrumb={{ label: t("Settings"), href: "/settings" }}
        title={t("Church data")}
        subtitle={t("Identification and regional preferences.")}
        backHref="/settings"
        backTitle="Voltar para Configurações"
      />

      <div className="bg-white rounded-2xl flex-1 border border-[#E5E7EB] shadow-sm overflow-hidden">

        {loading ? (
          <div className="p-10 text-center text-sm text-[#6B7280]">{t("Loading...")}</div>
        ) : (
          <form onSubmit={save} className="p-6 flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-[6px] md:col-span-2">
                <label htmlFor="org-name" className="text-[13px] font-[600] text-[#4B5563]">
                  Nome <span className="text-[#EF4444] ml-0.5">*</span>
                </label>
                <input
                  id="org-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="h-[42px] px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
                />
              </div>

              <div className="flex flex-col gap-[6px]">
                <label htmlFor="org-email" className="text-[13px] font-[600] text-[#4B5563]">E-mail</label>
                <input
                  id="org-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-[42px] px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
                />
              </div>

              <div className="flex flex-col gap-[6px]">
                <label htmlFor="org-phone" className="text-[13px] font-[600] text-[#4B5563]">Telefone</label>
                <input
                  id="org-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="h-[42px] px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
                />
              </div>

              <div className="flex flex-col gap-[6px]">
                <label htmlFor="org-doc" className="text-[13px] font-[600] text-[#4B5563]">CNPJ</label>
                <input
                  id="org-doc"
                  value={form.document}
                  onChange={(e) => setForm({ ...form, document: e.target.value })}
                  className="h-[42px] px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
                />
              </div>

              <div className="flex flex-col gap-[6px]">
                <label className="text-[13px] font-[600] text-[#4B5563]">{t("Time zone")}</label>
                <CustomSelect
                  value={form.timezone}
                  onChange={(value: string) => setForm({ ...form, timezone: value })}
                  searchable
                  className="h-[42px]"
                  options={TIMEZONES.map((tz) => ({ value: tz, label: tz }))}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#F1F1F4]">
              <button
                type="submit"
                disabled={saving || !form.name.trim()}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[#6D28D9] text-white text-[13px] font-semibold hover:bg-[#5B21B6] disabled:opacity-50 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" strokeWidth={2.4} />
                {saving ? t("Saving...") : t("Save")}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
