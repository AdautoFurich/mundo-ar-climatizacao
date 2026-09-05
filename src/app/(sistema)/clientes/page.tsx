import { Filter, Search, UserPlus, UsersRound, X } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { ClientList } from "@/features/clientes/components/client-list";
import { listClients } from "@/features/clientes/queries";
import type { ClientStatusFilter } from "@/features/clientes/types";
import { requirePermission } from "@/lib/auth/guards";

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("clientes:consultar");
  const params = await searchParams;
  const search = firstValue(params.busca).trim().slice(0, 80);
  const requestedStatus = firstValue(params.situacao);
  const status: ClientStatusFilter = ["ativos", "inativos", "todos"].includes(
    requestedStatus,
  )
    ? (requestedStatus as ClientStatusFilter)
    : "ativos";
  const requestedPage = Number(firstValue(params.pagina));
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const result = await listClients({ page, search, status });

  return (
    <AppShell
      currentPath="/clientes"
      description="Cadastre e acompanhe os clientes da oficina"
      title="Clientes"
      user={user}
    >
      <div className="min-h-[calc(100dvh-5.35rem)] px-3 py-3 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[96rem]">
          <section className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid size-10 place-items-center rounded-lg bg-teal-50 text-[var(--action)]"
              >
                <UsersRound className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--brand)]">
                  {result.total} cliente{result.total === 1 ? "" : "s"}
                </p>
                <p className="text-xs text-[var(--ink-muted)]">
                  {status === "ativos"
                    ? "Clientes ativos"
                    : status === "inativos"
                      ? "Clientes inativos"
                      : "Todos os clientes"}
                </p>
              </div>
            </div>
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--action)] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(15,118,110,0.18)] hover:bg-[var(--action-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2"
              href="/clientes/novo"
            >
              <UserPlus aria-hidden="true" className="size-4" />
              Novo cliente
            </Link>
          </section>

          <form className="mb-3 grid gap-2 rounded-xl border bg-white p-3 shadow-[0_2px_8px_rgba(16,45,63,0.04)] sm:grid-cols-[minmax(0,1fr)_12rem_auto]" method="get">
            <label className="relative" htmlFor="busca-clientes">
              <span className="sr-only">Buscar clientes</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--ink-faint)]"
              />
              <input
                className="min-h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-base outline-none placeholder:text-slate-400 focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/20"
                defaultValue={search}
                id="busca-clientes"
                name="busca"
                placeholder="Buscar por nome, CPF, telefone ou e-mail"
                type="search"
              />
            </label>
            <label className="relative" htmlFor="situacao-clientes">
              <span className="sr-only">Filtrar por situação</span>
              <Filter
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--ink-faint)]"
              />
              <select
                className="min-h-11 w-full appearance-none rounded-lg border bg-white pl-10 pr-3 text-base outline-none focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/20"
                defaultValue={status}
                id="situacao-clientes"
                name="situacao"
              >
                <option value="ativos">Ativos</option>
                <option value="inativos">Inativos</option>
                <option value="todos">Todos</option>
              </select>
            </label>
            <div className="flex gap-2">
              <button
                className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-lg bg-[var(--brand)] px-4 text-sm font-semibold text-white hover:bg-[var(--brand-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2"
                type="submit"
              >
                Aplicar
              </button>
              {(search || status !== "ativos") && (
                <Link
                  aria-label="Limpar busca e filtros"
                  className="grid size-11 place-items-center rounded-lg border text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                  href="/clientes"
                  title="Limpar filtros"
                >
                  <X aria-hidden="true" className="size-4" />
                </Link>
              )}
            </div>
          </form>

          <ClientList result={result} search={search} status={status} />
        </div>
      </div>
    </AppShell>
  );
}
