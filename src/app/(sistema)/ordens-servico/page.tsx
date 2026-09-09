import { ClipboardList, Filter, Plus, Search, TriangleAlert, X } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { OrderList } from "@/features/ordens-servico/components/order-list";
import { ORDER_STATUS_LABELS } from "@/features/ordens-servico/formatters";
import { parseOrderListFilters } from "@/features/ordens-servico/query-helpers";
import {
  listActiveOrderResponsibles,
  listServiceOrders,
} from "@/features/ordens-servico/queries";
import { ORDER_STATUS_VALUES, type ServiceOrderListResult } from "@/features/ordens-servico/types";
import { requirePermission } from "@/lib/auth/guards";

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function ServiceOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("ordens:consultar");
  const params = await searchParams;
  const filters = parseOrderListFilters({
    page: firstValue(params.pagina),
    search: firstValue(params.busca),
    status: firstValue(params.situacao),
    responsibleId: firstValue(params.responsavel),
    dateFrom: firstValue(params.de),
    dateTo: firstValue(params.ate),
  });
  const [ordersResult, responsiblesResult] = await Promise.allSettled([
    listServiceOrders(filters),
    listActiveOrderResponsibles(),
  ]);
  const loadError = ordersResult.status === "rejected";
  const result: ServiceOrderListResult =
    ordersResult.status === "fulfilled"
      ? ordersResult.value
      : { orders: [], total: 0, page: filters.page, pageSize: 10, totalPages: 1 };
  const responsibles =
    responsiblesResult.status === "fulfilled" ? responsiblesResult.value : [];
  const hasFilters = Boolean(
    filters.search ||
      filters.status !== "todas" ||
      filters.responsibleId ||
      filters.dateFrom ||
      filters.dateTo,
  );

  return (
    <AppShell
      currentPath="/ordens-servico"
      description="Acompanhe os atendimentos desde a entrada até a entrega"
      title="Ordens de serviço"
      user={user}
    >
      <div className="min-h-[calc(100dvh-5.35rem)] px-3 py-3 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[100rem]">
          {params.criada && (
            <p className="mb-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-[var(--success)]" role="status">
              Ordem de serviço aberta com sucesso.
            </p>
          )}

          <section className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="grid size-10 place-items-center rounded-lg bg-teal-50 text-[var(--action)]">
                <ClipboardList className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--brand)]">
                  {result.total} ordem{result.total === 1 ? "" : "s"}
                </p>
                <p className="text-xs text-[var(--ink-muted)]">Atendimentos encontrados</p>
              </div>
            </div>
            <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--action)] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(15,118,110,0.18)] hover:bg-[var(--action-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2" href="/ordens-servico/nova">
              <Plus aria-hidden="true" className="size-4" />
              Nova ordem de serviço
            </Link>
          </section>

          <form className="mb-3 rounded-xl border bg-white p-3 shadow-[0_2px_8px_rgba(16,45,63,0.04)]" method="get">
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(16rem,1.5fr)_minmax(11rem,0.8fr)_minmax(11rem,0.8fr)_9rem_9rem_auto]">
              <label className="relative" htmlFor="busca-ordens">
                <span className="sr-only">Buscar ordens de serviço</span>
                <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--ink-faint)]" />
                <input className="min-h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-base outline-none placeholder:text-slate-400 focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/20" defaultValue={filters.search} id="busca-ordens" name="busca" placeholder="OS, cliente, placa ou veículo" type="search" />
              </label>
              <label className="relative" htmlFor="situacao-ordens">
                <span className="sr-only">Filtrar por situação</span>
                <Filter aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--ink-faint)]" />
                <select className="min-h-11 w-full appearance-none rounded-lg border bg-white pl-10 pr-3 text-base outline-none focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/20" defaultValue={filters.status} id="situacao-ordens" name="situacao">
                  <option value="todas">Todas as situações</option>
                  {ORDER_STATUS_VALUES.map((status) => <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>)}
                </select>
              </label>
              <label htmlFor="responsavel-ordens">
                <span className="sr-only">Filtrar por responsável</span>
                <select className="min-h-11 w-full rounded-lg border bg-white px-3 text-base outline-none focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/20" defaultValue={filters.responsibleId ?? ""} id="responsavel-ordens" name="responsavel">
                  <option value="">Todos os responsáveis</option>
                  {responsibles.map((responsible) => <option key={responsible.id} value={responsible.id}>{responsible.name}</option>)}
                </select>
              </label>
              <label htmlFor="ordens-de">
                <span className="sr-only">Data inicial</span>
                <input aria-label="Data inicial" className="min-h-11 w-full rounded-lg border bg-white px-3 text-base outline-none focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/20" defaultValue={filters.dateFrom ?? ""} id="ordens-de" name="de" type="date" />
              </label>
              <label htmlFor="ordens-ate">
                <span className="sr-only">Data final</span>
                <input aria-label="Data final" className="min-h-11 w-full rounded-lg border bg-white px-3 text-base outline-none focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/20" defaultValue={filters.dateTo ?? ""} id="ordens-ate" name="ate" type="date" />
              </label>
              <div className="flex gap-2">
                <button className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-lg bg-[var(--brand)] px-4 text-sm font-semibold text-white hover:bg-[var(--brand-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2" type="submit">Aplicar</button>
                {hasFilters && (
                  <Link aria-label="Limpar busca e filtros" className="grid size-11 shrink-0 place-items-center rounded-lg border text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href="/ordens-servico" title="Limpar filtros"><X aria-hidden="true" className="size-4" /></Link>
                )}
              </div>
            </div>
          </form>

          {loadError ? (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-950" role="alert">
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              <div><p className="font-semibold">Não foi possível carregar as ordens.</p><p className="text-sm">Atualize a página para tentar novamente.</p></div>
            </div>
          ) : (
            <OrderList filters={filters} result={result} />
          )}
        </div>
      </div>
    </AppShell>
  );
}
