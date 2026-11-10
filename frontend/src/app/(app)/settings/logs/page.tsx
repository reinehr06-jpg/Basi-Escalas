"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Activity, Search, X } from "lucide-react";
import Pagination from "@/components/Pagination";
import DetailHero from "@/components/escalas/DetailHero";
import EmptyState from "@/components/escalas/EmptyState";
import { usePersistedState } from "@/hooks/usePersistedState";
import { AuditLogsService, type AuditLog } from "@/services/audit-logs.service";
import { formatDateTime } from "@/lib/escalas-format";

export default function AuditLogsPage() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = usePersistedState("logs:q", "");
  const [currentPage, setCurrentPage] = usePersistedState("logs:page", 1);
  const [pageSize, setPageSize] = usePersistedState("logs:size", 20);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await AuditLogsService.list({ page: currentPage, itemsPerPage: pageSize, q: searchTerm });
      setItems(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível carregar o histórico.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(fetchItems, 400);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  return (
    <main className="p-4 md:py-5 px-4 md:px-8 flex-1 flex flex-col max-w-screen-2xl mx-auto w-full">
        <DetailHero
          icon={Activity}
          breadcrumb={{ label: "Configurações", href: "/settings" }}
          title="Registro de atividades"
          subtitle="Publicações, trocas, exclusões e alterações, com autor e data."
          backHref="/settings"
          backTitle="Voltar para Configurações"
        />

      <div className="bg-white rounded-2xl flex-1 border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">

        <div className="p-6">
          <div className="relative flex items-center w-full sm:w-[280px] h-9 bg-white border border-[#E5E7EB] rounded-lg px-3 focus-within:border-[#6D28D9] transition-colors">
            <Search className="text-[#9CA3AF] w-4 h-4 mr-2 shrink-0" strokeWidth={2.4} />
            <input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por ação, autor ou descrição"
              aria-label="Buscar no histórico"
              className="bg-transparent border-none outline-none text-[13px] text-[#1A1A2E] placeholder-[#9CA3AF] w-full pr-6"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 p-0.5 rounded-full text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#F3F4F6] transition-colors"
                aria-label="Limpar busca"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-[#6B7280]">Carregando…</div>
        ) : items.length === 0 ? (
          <EmptyState icon={Activity} title="Nenhum registro encontrado" />
        ) : (
          <ul className="divide-y divide-[#F1F1F4] border-t border-[#F1F1F4]">
            {items.map((log) => (
              <li key={log.id} className="px-6 py-3 flex items-start gap-3">
                <span className="inline-flex items-center h-[20px] px-1.5 rounded bg-[#F3F4F6] text-[10.5px] font-semibold text-[#4B5563] shrink-0 mt-0.5 font-mono">
                  {log.action}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-[#1A1A2E]">{log.description}</p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    {log.user_name ?? "Sistema"} · {formatDateTime(log.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Pagination
          total={total}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>
    </main>
  );
}
