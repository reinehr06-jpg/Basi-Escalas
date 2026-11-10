"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, FileSpreadsheet } from "lucide-react";
import PageHeader from "@/components/escalas/PageHeader";
import BackButton from "@/components/BackButton";
import CustomSelect from "@/components/CustomSelect";
import { VolunteersService, type ImportItem } from "@/services/volunteers.service";
import { MinistriesService } from "@/services/ministries.service";
import type { Ministry } from "@/types/escalas";

const SAMPLE = `nome;email;telefone;id_externo
Ana Souza;ana@exemplo.com;+5551999990000;1042
Bruno Lima;bruno@exemplo.com;;1043`;

/**
 * Importação por colagem de CSV.
 *
 * Casa por id_externo e, na falta dele, por e-mail — rodar duas vezes
 * atualiza em vez de duplicar.
 */
export default function ImportVolunteersPage() {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [source, setSource] = useState("planilha");
  const [ministryId, setMinistryId] = useState("");
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    MinistriesService.list({ itemsPerPage: 200, status: "active" })
      .then((res) => setMinistries(res.data ?? []))
      .catch(() => setMinistries([]));
  }, []);

  const parse = (): ImportItem[] => {
    const lines = raw.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return [];

    const separator = lines[0].includes(";") ? ";" : ",";
    const header = lines[0].toLowerCase();
    const hasHeader = header.includes("nome") || header.includes("name");
    const rows = hasHeader ? lines.slice(1) : lines;

    const items: ImportItem[] = [];

    for (const line of rows) {
      const [name, email, phone, externalId] = line.split(separator).map((cell) => cell.trim());
      if (!name) continue;

      items.push({
        name,
        email: email || undefined,
        phone: phone || undefined,
        external_id: externalId || undefined,
        ministry_id: ministryId || undefined,
      });
    }

    return items;
  };

  const preview = parse();

  const submit = async () => {
    if (preview.length === 0) return;
    setBusy(true);
    try {
      const res = await VolunteersService.import(source.trim() || "planilha", preview);
      toast.success(res.message);
      router.push("/volunteers");
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível importar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="p-6 pb-5 flex-1 flex flex-col">
      <div className="bg-white rounded-2xl flex-1 border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 pt-5">
          <BackButton href="/volunteers" />
        </div>

        <PageHeader
          icon={Upload}
          title="Importar voluntários"
          subtitle="Cole as linhas da planilha. Importar de novo atualiza quem já existe."
        />

        <div className="p-6 flex flex-col gap-5">
          <div className="rounded-xl border border-[#E5E7EB] bg-[#FCFCFD] p-4">
            <p className="text-[12px] font-semibold text-[#4B5563] flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-[#9CA3AF]" />
              Formato esperado — uma pessoa por linha
            </p>
            <pre className="mt-2 text-[11.5px] text-[#4B5563] font-mono whitespace-pre-wrap">{SAMPLE}</pre>
            <p className="text-[11px] text-[#6B7280] mt-2">
              Separador <code>;</code> ou <code>,</code>. Só o nome é obrigatório; o cabeçalho é opcional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="imp-source" className="text-[13px] font-[600] text-[#4B5563]">Origem</label>
              <input
                id="imp-source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="planilha, church_os…"
                className="h-[42px] px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] outline-none focus:border-[#6D28D9]"
              />
              <span className="text-[11px] text-[#9CA3AF]">Fica guardado no cadastro para reconciliar depois.</span>
            </div>

            <div className="flex flex-col gap-[6px]">
              <label className="text-[13px] font-[600] text-[#4B5563]">Vincular ao ministério</label>
              <CustomSelect
                value={ministryId}
                onChange={(value: string) => setMinistryId(value)}
                placeholder="Nenhum"
                searchable
                isClearable
                className="h-[42px]"
                options={ministries.map((m) => ({ value: m.id, label: m.name }))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-[6px]">
            <label htmlFor="imp-raw" className="text-[13px] font-[600] text-[#4B5563]">Dados</label>
            <textarea
              id="imp-raw"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={10}
              placeholder="Cole aqui as linhas da planilha"
              className="px-3 py-2.5 rounded-lg border border-[#E5E7EB] text-[12.5px] text-[#1A1A2E] font-mono outline-none focus:border-[#6D28D9] resize-y"
            />
          </div>

          {preview.length > 0 && (
            <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
              <header className="px-4 h-10 flex items-center border-b border-[#F1F1F4] bg-[#FCFCFD]">
                <h2 className="text-[12px] font-bold text-[#6B7280]">
                  Prévia — {preview.length} pessoa(s)
                </h2>
              </header>
              <ul className="divide-y divide-[#F1F1F4] max-h-[260px] overflow-y-auto">
                {preview.slice(0, 50).map((item, index) => (
                  <li key={index} className="px-4 py-2 flex items-center gap-3">
                    <span className="text-[13px] text-[#1A1A2E] flex-1 truncate">{item.name}</span>
                    <span className="text-[11px] text-[#6B7280] truncate">{item.email ?? "—"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#F1F1F4]">
            <button
              onClick={() => router.back()}
              className="px-4 h-9 rounded-lg border border-[#E5E7EB] text-[13px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={submit}
              disabled={preview.length === 0 || busy}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[#6D28D9] text-white text-[13px] font-semibold hover:bg-[#5B21B6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" strokeWidth={2.4} />
              {busy ? "Importando…" : `Importar ${preview.length || ""}`}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
