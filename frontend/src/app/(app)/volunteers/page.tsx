"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Users, Plus, Search, Pencil, Trash2, X, Upload } from "lucide-react";
import Pagination from "@/components/Pagination";
import ResponsiveTableCard from "@/components/ResponsiveTableCard";
import DeleteModal from "@/components/modals/DeleteModal";
import CustomSelect from "@/components/CustomSelect";
import PageHeader from "@/components/escalas/PageHeader";
import StatusBadge from "@/components/escalas/StatusBadge";
import VolunteerAvatar from "@/components/escalas/VolunteerAvatar";
import EmptyState from "@/components/escalas/EmptyState";
import { usePersistedState } from "@/hooks/usePersistedState";
import { VolunteersService } from "@/services/volunteers.service";
import { MinistriesService } from "@/services/ministries.service";
import type { Ministry, Volunteer } from "@/types/escalas";

export default function VolunteersPage() {
  const [items, setItems] = useState<Volunteer[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = usePersistedState("volunteers:q", "");
  const [ministryId, setMinistryId] = usePersistedState("volunteers:ministry", "");
  const [status, setStatus] = usePersistedState("volunteers:status", "");
  const [currentPage, setCurrentPage] = usePersistedState("volunteers:page", 1);
  const [pageSize, setPageSize] = usePersistedState("volunteers:size", 10);

  const [toDelete, setToDelete] = useState<Volunteer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const ministryById = useMemo(
    () => Object.fromEntries(ministries.map((m) => [m.id, m])),
    [ministries],
  );

  useEffect(() => {
    MinistriesService.list({ itemsPerPage: 200 })
      .then((res) => setMinistries(res.data ?? []))
      .catch(() => setMinistries([]));
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await VolunteersService.list({
        page: currentPage,
        itemsPerPage: pageSize,
        q: searchTerm,
        ministry_id: ministryId || undefined,
        status: status || undefined,
      });
      setItems(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível carregar os voluntários.");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, ministryId, status]);

  useEffect(() => {
    const timer = setTimeout(fetchItems, 400);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const res = await VolunteersService.remove(toDelete.id);
      toast.success(res.message);
      setToDelete(null);
      fetchItems();
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível excluir o voluntário.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <main className="p-6 pb-5 flex-1 flex flex-col">
        <div className="bg-white rounded-2xl flex-1 border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
          <PageHeader
            icon={Users}
            title="Voluntários"
            subtitle="Quem serve, em quais ministérios e funções."
          />

          <div className="p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex gap-2">
              <Link
                href="/volunteers/new"
                className="flex items-center justify-center gap-1.5 px-4 h-9 bg-[#6D28D9] text-white text-[13px] font-semibold rounded-lg hover:bg-[#5B21B6] transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" strokeWidth={2.4} />
                Novo voluntário
              </Link>
              <Link
                href="/volunteers/import"
                className="flex items-center justify-center gap-1.5 px-4 h-9 border border-[#E5E7EB] bg-white text-[#4B5563] text-[13px] font-semibold rounded-lg hover:bg-[#F9FAFB] transition-colors"
              >
                <Upload className="w-4 h-4" strokeWidth={2.2} />
                Importar
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="w-full sm:w-[180px]">
                <CustomSelect
                  value={ministryId}
                  onChange={(value: string) => {
                    setMinistryId(value);
                    setCurrentPage(1);
                  }}
                  placeholder="Todos os ministérios"
                  searchable
                  isClearable
                  className="h-9"
                  options={ministries.map((m) => ({ value: m.id, label: m.name }))}
                />
              </div>
              <div className="w-full sm:w-[140px]">
                <CustomSelect
                  value={status}
                  onChange={(value: string) => {
                    setStatus(value);
                    setCurrentPage(1);
                  }}
                  placeholder="Todas"
                  isClearable
                  className="h-9"
                  options={[
                    { value: "active", label: "Ativos" },
                    { value: "on_leave", label: "Afastados" },
                    { value: "inactive", label: "Inativos" },
                  ]}
                />
              </div>
              <div className="relative flex items-center w-full sm:w-[220px] h-9 bg-white border border-[#E5E7EB] rounded-lg px-3 focus-within:border-[#6D28D9] transition-colors">
                <Search className="text-[#9CA3AF] w-4 h-4 mr-2 shrink-0" strokeWidth={2.4} />
                <input
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Nome, e-mail ou telefone"
                  aria-label="Buscar voluntário"
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
          </div>

          <ResponsiveTableCard minWidth="900px">
            <div className="grid grid-cols-[110px_1.6fr_1.6fr_130px_1.4fr_110px] min-w-[900px] items-center px-6 h-10 border-t border-b border-[#F1F1F4] bg-[#FCFCFD]">
              <span className="text-xs font-bold text-[#6B7280]">Situação</span>
              <span className="text-xs font-bold text-[#6B7280]">Voluntário</span>
              <span className="text-xs font-bold text-[#6B7280]">E-mail</span>
              <span className="text-xs font-bold text-[#6B7280]">Telefone</span>
              <span className="text-xs font-bold text-[#6B7280]">Ministérios</span>
              <span className="text-xs font-bold text-[#6B7280] text-center">Ações</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-[#6B7280]">Carregando…</div>
            ) : items.length === 0 ? (
              <EmptyState icon={Users} title="Nenhum voluntário encontrado" description="Cadastre ou importe as pessoas que servem." />
            ) : (
              items.map((volunteer) => (
                <div
                  key={volunteer.id}
                  className="grid grid-cols-[110px_1.6fr_1.6fr_130px_1.4fr_110px] min-w-[900px] items-center px-6 h-[42px] bg-white border-b border-[#F1F1F4] hover:bg-[#FAFAFC] transition-colors last:border-b-0"
                >
                  <div>
                    <StatusBadge status={volunteer.status} />
                  </div>

                  <div className="flex items-center gap-2 min-w-0 pr-4">
                    <VolunteerAvatar name={volunteer.name} photoUrl={volunteer.photo_url} size={22} />
                    <Link href={`/volunteers/${volunteer.id}`} className="text-xs font-[600] text-[#6D28D9] truncate cursor-pointer hover:underline">
                      {volunteer.name}
                    </Link>
                  </div>

                  <span className="text-xs font-[500] text-[#4B5563] truncate pr-4">{volunteer.email || "-"}</span>
                  <span className="text-xs font-[500] text-[#4B5563] truncate pr-4">{volunteer.phone || "-"}</span>

                  <div className="flex flex-nowrap gap-1 min-w-0 overflow-hidden pr-4">
                    {(volunteer.memberships ?? []).slice(0, 2).map((membership) => {
                      const ministry = ministryById[membership.ministry_id];
                      return (
                        <span
                          key={membership.ministry_id}
                          className="inline-flex items-center h-[20px] px-1.5 rounded text-[10.5px] font-semibold"
                          style={{
                            backgroundColor: `${ministry?.color ?? "#6B7280"}14`,
                            color: ministry?.color ?? "#6B7280",
                          }}
                        >
                          {ministry?.name ?? "—"}
                        </span>
                      );
                    })}
                    {(volunteer.memberships?.length ?? 0) > 2 && (
                      <span className="text-[10.5px] text-[#9CA3AF] shrink-0">+{(volunteer.memberships?.length ?? 0) - 2}</span>
                    )}
                    {(volunteer.memberships?.length ?? 0) === 0 && (
                      <span className="text-xs text-[#9CA3AF]">-</span>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-1.5">
                    <Link
                      href={`/volunteers/${volunteer.id}/edit`}
                      className="w-8 h-8 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-center hover:bg-[#F3F4F6] transition-colors"
                      aria-label={`Editar ${volunteer.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#6B7280]" strokeWidth={2.2} />
                    </Link>
                    <button
                      onClick={() => setToDelete(volunteer)}
                      className="w-8 h-8 rounded-lg bg-[#EF4444]/10 flex items-center justify-center hover:bg-[#EF4444]/20 transition-colors border border-transparent"
                      aria-label={`Excluir ${volunteer.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </ResponsiveTableCard>

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

      <DeleteModal
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        itemName={toDelete?.name}
        isLoading={deleting}
        description="Voluntários com escalações futuras não podem ser excluídos. Marque como inativo para preservar o histórico."
      />
    </>
  );
}
