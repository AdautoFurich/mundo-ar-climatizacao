import {
  AlertTriangle,
  CalendarClock,
  CarFront,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  SearchX,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  formatOrderDate,
  formatOrderMoney,
  formatOrderNumber,
  formatOrderStatus,
} from "../formatters";
import type { OrderListFilters } from "../query-helpers";
import type { OrderStatus, ServiceOrderListResult, ServiceOrderSummary } from "../types";

const statusClasses: Record<OrderStatus, string> = {
  aberta: "bg-blue-50 text-blue-700 ring-blue-700/15",
  em_diagnostico: "bg-sky-50 text-sky-700 ring-sky-700/15",
  aguardando_aprovacao: "bg-amber-50 text-[var(--warning)] ring-amber-700/15",
  aprovada: "bg-teal-50 text-[var(--action)] ring-teal-700/15",
  em_execucao: "bg-cyan-50 text-cyan-800 ring-cyan-700/15",
  pronta_retirada: "bg-green-50 text-[var(--success)] ring-green-700/15",
  entregue: "bg-emerald-50 text-emerald-800 ring-emerald-700/15",
  reprovada: "bg-red-50 text-[var(--danger)] ring-red-700/15",
  cancelada: "bg-slate-100 text-slate-600 ring-slate-500/15",
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset",
        statusClasses[status],
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {formatOrderStatus(status)}
    </span>
  );
}

function DueDate({ order }: { order: ServiceOrderSummary }) {
  if (!order.expectedCompletionAt) {
    return <span className="text-[var(--ink-faint)]">Sem previsão</span>;
  }
  return (
    <div>
      <span className={order.overdue ? "font-semibold text-[var(--danger)]" : ""}>
        {formatOrderDate(order.expectedCompletionAt)}
      </span>
      {order.overdue && (
        <span className="mt-1 flex items-center gap-1 text-xs font-bold text-[var(--danger)]">
          <AlertTriangle aria-hidden="true" className="size-3.5" />
          Atrasada
        </span>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: ServiceOrderSummary }) {
  return (
    <article className="min-w-0 rounded-xl border bg-white p-4 shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-teal-50 text-[var(--action)]"
        >
          <ClipboardList className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold text-[var(--brand)]">
            {formatOrderNumber(order.number)}
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-[var(--ink)]">
            {order.vehicleLabel}
          </p>
          <p className="text-xs font-semibold tracking-[0.05em] text-[var(--ink-muted)]">
            {order.vehiclePlate}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <dl className="mt-4 grid gap-2.5 text-sm">
        <div className="flex min-w-0 items-center gap-2">
          <UserRound aria-hidden="true" className="size-4 text-[var(--ink-faint)]" />
          <dt className="sr-only">Cliente</dt>
          <dd className="truncate">{order.clientName}</dd>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <CalendarClock aria-hidden="true" className="size-4 text-[var(--ink-faint)]" />
          <dt className="shrink-0 text-[var(--ink-muted)]">Previsão:</dt>
          <dd><DueDate order={order} /></dd>
        </div>
        <div className="flex items-center justify-between border-t pt-3">
          <div>
            <dt className="text-xs text-[var(--ink-muted)]">Responsável</dt>
            <dd className="font-semibold">{order.responsibleName}</dd>
          </div>
          <div className="text-right">
            <dt className="text-xs text-[var(--ink-muted)]">Total atual</dt>
            <dd className="font-display font-bold text-[var(--brand)]">
              {formatOrderMoney(order.authorizedTotal)}
            </dd>
          </div>
        </div>
      </dl>
    </article>
  );
}

function pageUrl(filters: OrderListFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.search) params.set("busca", filters.search);
  if (filters.status !== "todas") params.set("situacao", filters.status);
  if (filters.responsibleId) params.set("responsavel", filters.responsibleId);
  if (filters.dateFrom) params.set("de", filters.dateFrom);
  if (filters.dateTo) params.set("ate", filters.dateTo);
  if (page > 1) params.set("pagina", String(page));
  const query = params.toString();
  return query ? `/ordens-servico?${query}` : "/ordens-servico";
}

function hasFilters(filters: OrderListFilters) {
  return Boolean(
    filters.search ||
      filters.status !== "todas" ||
      filters.responsibleId ||
      filters.dateFrom ||
      filters.dateTo,
  );
}

export function OrderList({
  filters,
  result,
}: {
  filters: OrderListFilters;
  result: ServiceOrderListResult;
}) {
  if (result.orders.length === 0) {
    const filtered = hasFilters(filters);
    return (
      <div className="rounded-xl border bg-white px-5 py-16 text-center shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
        <span
          aria-hidden="true"
          className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--surface-subtle)] text-[var(--ink-faint)]"
        >
          <SearchX className="size-6" />
        </span>
        <h2 className="mt-4 font-display text-xl font-bold text-[var(--brand)]">
          {filtered ? "Nenhuma ordem encontrada" : "Nenhuma ordem de serviço aberta"}
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-[var(--ink-muted)]">
          {filtered
            ? "Ajuste a busca ou os filtros para consultar outros atendimentos."
            : "Abra a primeira ordem para registrar a entrada de um veículo."}
        </p>
        {filtered && (
          <Link
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
            href="/ordens-servico"
          >
            Limpar filtros
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid min-w-0 gap-3 md:hidden">
        {result.orders.map((order) => <OrderCard key={order.id} order={order} />)}
      </div>

      <section className="hidden overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)] md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[68rem] border-collapse text-left">
            <caption className="sr-only">Ordens de serviço da oficina</caption>
            <thead>
              <tr className="border-b bg-[var(--surface-subtle)] text-2xs font-bold uppercase tracking-[0.06em] text-[var(--ink-faint)]">
                <th className="px-4 py-3" scope="col">Ordem</th>
                <th className="px-3 py-3" scope="col">Veículo</th>
                <th className="px-3 py-3" scope="col">Cliente</th>
                <th className="px-3 py-3" scope="col">Entrada</th>
                <th className="px-3 py-3" scope="col">Previsão</th>
                <th className="px-3 py-3" scope="col">Situação</th>
                <th className="px-3 py-3" scope="col">Responsável</th>
                <th className="px-4 py-3 text-right" scope="col">Total atual</th>
              </tr>
            </thead>
            <tbody>
              {result.orders.map((order) => (
                <tr className="border-b last:border-0 hover:bg-[var(--surface-subtle)]" key={order.id}>
                  <td className="px-4 py-3 font-display font-bold text-[var(--brand)]">
                    {formatOrderNumber(order.number)}
                  </td>
                  <td className="px-3 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CarFront aria-hidden="true" className="size-4 text-[var(--ink-faint)]" />
                      <div>
                        <p className="font-semibold text-[var(--ink)]">{order.vehicleLabel}</p>
                        <p className="text-xs tracking-[0.05em] text-[var(--ink-muted)]">{order.vehiclePlate}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-[var(--ink)]">{order.clientName}</td>
                  <td className="px-3 py-3 text-sm tabular-nums text-[var(--ink-muted)]">{formatOrderDate(order.entryAt)}</td>
                  <td className="px-3 py-3 text-sm tabular-nums"><DueDate order={order} /></td>
                  <td className="px-3 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-3 py-3 text-sm text-[var(--ink)]">{order.responsibleName}</td>
                  <td className="px-4 py-3 text-right font-display font-bold tabular-nums text-[var(--brand)]">
                    {formatOrderMoney(order.authorizedTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <nav aria-label="Paginação de ordens de serviço" className="mt-3 flex flex-col items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-sm sm:flex-row">
        <p className="text-[var(--ink-muted)]">
          Página <strong className="text-[var(--ink)]">{result.page}</strong> de{" "}
          <strong className="text-[var(--ink)]">{result.totalPages}</strong>
        </p>
        <div className="flex gap-2">
          {result.page > 1 ? (
            <Link className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 font-semibold text-[var(--brand)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href={pageUrl(filters, result.page - 1)}>
              <ChevronLeft aria-hidden="true" className="size-4" /> Anterior
            </Link>
          ) : (
            <span aria-disabled="true" className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 text-slate-400"><ChevronLeft aria-hidden="true" className="size-4" /> Anterior</span>
          )}
          {result.page < result.totalPages ? (
            <Link className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 font-semibold text-[var(--brand)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href={pageUrl(filters, result.page + 1)}>
              Próxima <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          ) : (
            <span aria-disabled="true" className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 text-slate-400">Próxima <ChevronRight aria-hidden="true" className="size-4" /></span>
          )}
        </div>
      </nav>
    </>
  );
}
