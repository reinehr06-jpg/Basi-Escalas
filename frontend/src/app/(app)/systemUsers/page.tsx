"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { UsersRound, Plus, Search, Pencil, Trash2, X } from "lucide-react";
import Pagination from "@/components/Pagination";
import ResponsiveTableCard from "@/components/ResponsiveTableCard";
import DeleteModal from "@/components/modals/DeleteModal";
import PageHeader from "@/components/escalas/PageHeader";
import StatusBadge from "@/components/escalas/StatusBadge";
import EmptyState from "@/components/escalas/EmptyState";
import { usePersistedState } from "@/hooks/usePersistedState";
import { SystemUsersService } from "@/services/system-users.service";
import type { SystemUser } from "@/components/forms/SystemUserForm";
import { ROLE_LABELS } from "@/lib/escalas-format";

export default function SystemUsersPage() {
  const [items, setItems] = useState<SystemUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = usePersistedState("systemUsers:q", "");
  const [currentPage, setCurrentPage] = usePersistedState("systemUsers:page", 1);
  const [pageSize, setPageSize] = usePersistedState("systemUsers:size", 10);

  const [toDelete, setToDelete] = useState<SystemUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await SystemUsersService.list({
        page: currentPage,
        itemsPerPage: pageSize,
        q: searchTerm,
      });
      setItems(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível carregar os usuários.");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(fetchItems, 400);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const res = await SystemUsersService.remove(toDelete.id);
      toast.success(res.message);
      setToDelete(null);
      fetchItems();
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível excluir o usuário.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <main className="p-6 pb-5 flex-1 flex flex-col">
        <div className="bg-white rounded-2xl flex-1 border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
          <PageHeader
            icon={UsersRound}
            title="Usuários do sistema"
            subtitle="Quem acessa o sistema e com qual papel."
          />

          <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Link
              href="/systemUsers/new"
              className="flex items-center justify-center gap-1.5 px-4 h-9 bg-[#6D28D9] text-white text-[13px] font-semibold rounded-lg hover:bg-[#5B21B6] transition-colors shadow-sm w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" strokeWidth={2.4} />
              Novo usuário
            </Link>

            <div className="relative flex items-center w-full sm:w-[240px] h-9 bg-white border border-[#E5E7EB] rounded-lg px-3 focus-within:border-[#6D28D9] transition-colors">
              <Search className="text-[#9CA3AF] w-4 h-4 mr-2 shrink-0" strokeWidth={2.4} />
              <input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Nome ou e-mail"
                aria-label="Buscar usuário"
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

          <ResponsiveTableCard minWidth="800px">
            <div className="grid grid-cols-[110px_1.4fr_1.8fr_200px_110px] min-w-[800px] items-center px-6 h-10 border-t border-b border-[#F1F1F4] bg-[#FCFCFD]">
              <span className="text-xs font-bold text-[#6B7280]">Situação</span>
              <span className="text-xs font-bold text-[#6B7280]">Usuário</span>
              <span className="text-xs font-bold text-[#6B7280]">E-mail</span>
              <span className="text-xs font-bold text-[#6B7280]">Papel</span>
              <span className="text-xs font-bold text-[#6B7280] text-center">Ações</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-[#6B7280]">Carregando…</div>
            ) : items.length === 0 ? (
              <EmptyState icon={UsersRound} title="Nenhum usuário encontrado" />
            ) : (
              items.map((user) => (
                <div
                  key={user.id}
                  className="grid grid-cols-[110px_1.4fr_1.8fr_200px_110px] min-w-[800px] items-center px-6 h-[42px] bg-white border-b border-[#F1F1F4] hover:bg-[#FAFAFC] transition-colors last:border-b-0"
                >
                  <div>
                    <StatusBadge status={user.status ?? "active"} />
                  </div>

                  <Link href={`/systemUsers/${user.id}/edit`} className="text-xs font-[600] text-[#6D28D9] truncate pr-4 cursor-pointer hover:underline">
                    {user.name}
                  </Link>

                  <span className="text-xs font-[500] text-[#4B5563] truncate pr-4">{user.email}</span>

                  <span className="text-xs font-[500] text-[#4B5563] truncate pr-4">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>

                  <div className="flex items-center justify-center gap-1.5">
                    <Link
                      href={`/systemUsers/${user.id}/edit`}
                      className="w-8 h-8 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-center hover:bg-[#F3F4F6] transition-colors"
                      aria-label={`Editar ${user.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#6B7280]" strokeWidth={2.2} />
                    </Link>
                    <button
                      onClick={() => setToDelete(user)}
                      className="w-8 h-8 rounded-lg bg-[#EF4444]/10 flex items-center justify-center hover:bg-[#EF4444]/20 transition-colors"
                      aria-label={`Excluir ${user.name}`}
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
        description="O acesso é removido. O cadastro de voluntário vinculado é preservado."
      />
    </>
  );
}
