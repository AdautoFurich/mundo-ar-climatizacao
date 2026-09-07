import {
  Banknote,
  CalendarDays,
  CarFront,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  SearchX,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import {
  formatOrderDate,
  formatOrderMoney,
  formatOrderNumber,
} from "@/features/ordens-servico/formatters";
import { ordersPeriodReportUrl } from "../query-helpers";
import type {
  OrdersPeriodReportFilters,
  OrdersPeriodReportResult,
  OrdersPeriodReportRow,
} from "../types";
import { ReportOrderStatusBadge } from "./report-order-status-badge";

function ReportCard({ order }: { order: OrdersPeriodReportRow }) {
  return (
    <article className="rounded-xl border bg-white p-4 shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link className="font-display text-lg font-bold text-[var(--brand)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href={`/ordens-servico/${order.id}`}>
            {formatOrderNumber(order.number)}
          </Link>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">{formatOrderDate(order.entryAt)}</p>
        </div>
        <ReportOrderStatusBadge status={order.status} />
      </div>
      <dl className="mt-4 grid gap-3 text-sm">
        <div className="flex items-start gap-2"><UserRound aria-hidden="true" className="mt-0.5 size-4 text-[var(--ink-faint)]" /><div><dt className="text-xs text-[var(--ink-muted)]">Cliente</dt><dd className="font-semibold">{order.clientName}</dd></div></div>
        <div className="flex items-start gap-2"><CarFront aria-hidden="true" className="mt-0.5 size-4 text-[var(--ink-faint)]" /><div><dt className="text-xs text-[var(--ink-muted)]">Veículo</dt><dd className="font-semibold">{order.vehicleLabel}</dd><dd className="text-xs tracking-[0.05em] text-[var(--ink-muted)]">{order.vehiclePlate}</dd></div></div>
        <div className="flex items-end justify-between gap-3 border-t pt-3"><div><dt className="text-xs text-[var(--ink-muted)]">Responsável</dt><dd className="font-semibold">{order.responsibleName}</dd></div><div className="text-right"><dt className="text-xs text-[var(--ink-muted)]">Valor</dt><dd className="font-display font-bold tabular-nums text-[var(--brand)]">{formatOrderMoney(order.total)}</dd></div></div>
      </dl>
    </article>
  );
}

export function OrdersPeriodReport({
  filters,
  result,
}: {
  filters: OrdersPeriodReportFilters;
  result: OrdersPeriodReportResult;
}) {
  if (result.total === 0) {
    return (
      <div className="rounded-xl border bg-white px-5 py-16 text-center shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
        <span aria-hidden="true" className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--surface-subtle)] text-[var(--ink-faint)]"><SearchX className="size-6" /></span>
        <h2 className="mt-4 font-display text-xl font-bold text-[var(--brand)]">Nenhuma ordem encontrada</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-[var(--ink-muted)]">Ajuste o período ou os filtros para consultar outros atendimentos.</p>
        <Link className="report-no-print mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href="/relatorios/ordens-periodo">Limpar filtros</Link>
      </div>
    );
  }

  return (
    <div className="report-print-area">
      <div className="report-print-only hidden">
        <h2 className="font-display text-2xl font-bold">Mundo Ar Climatização</h2>
        <p>Relatório de ordens de serviço por período</p>
      </div>

      <dl className="mb-3 grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
          <span aria-hidden="true" className="grid size-10 place-items-center rounded-lg bg-teal-50 text-[var(--action)]"><ClipboardList className="size-5" /></span>
          <div><dt className="text-xs font-semibold text-[var(--ink-muted)]">Ordens no resultado</dt><dd className="font-display text-2xl font-bold tabular-nums text-[var(--brand)]">{result.total}</dd><dd className="text-xs text-[var(--ink-muted)]">{result.total} {result.total === 1 ? "ordem encontrada" : "ordens encontradas"}</dd></div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
          <span aria-hidden="true" className="grid size-10 place-items-center rounded-lg bg-teal-50 text-[var(--action)]"><Banknote className="size-5" /></span>
          <div><dt className="text-xs font-semibold text-[var(--ink-muted)]">Valor total</dt><dd className="font-display text-2xl font-bold tabular-nums text-[var(--brand)]">{formatOrderMoney(result.totalValue)}</dd><dd className="text-xs text-[var(--ink-muted)]">Soma das ordens filtradas</dd></div>
        </div>
      </dl>

      <div className="report-no-print grid gap-3 md:hidden">
        {result.orders.map((order) => <ReportCard key={order.id} order={order} />)}
      </div>

      <section className="report-table hidden overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)] md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[68rem] border-collapse text-left" aria-label="Ordens de serviço por período">
            <thead><tr className="border-b bg-[var(--surface-subtle)] text-2xs font-bold uppercase tracking-[0.06em] text-[var(--ink-faint)]">
              <th className="px-4 py-3" scope="col">Ordem</th><th className="px-3 py-3" scope="col">Entrada</th><th className="px-3 py-3" scope="col">Cliente</th><th className="px-3 py-3" scope="col">Veículo</th><th className="px-3 py-3" scope="col">Situação</th><th className="px-3 py-3" scope="col">Responsável</th><th className="px-4 py-3 text-right" scope="col">Valor</th>
            </tr></thead>
            <tbody>{result.orders.map((order) => (
              <tr className="border-b last:border-0 hover:bg-[var(--surface-subtle)]" key={order.id}>
                <td className="px-4 py-3 font-display font-bold"><Link className="text-[var(--brand)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href={`/ordens-servico/${order.id}`}>{formatOrderNumber(order.number)}</Link></td>
                <td className="px-3 py-3 text-sm tabular-nums text-[var(--ink-muted)]"><span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="size-4 text-[var(--ink-faint)]" />{formatOrderDate(order.entryAt)}</span></td>
                <td className="px-3 py-3 text-sm font-medium">{order.clientName}</td>
                <td className="px-3 py-3 text-sm"><p className="font-semibold">{order.vehicleLabel}</p><p className="text-xs tracking-[0.05em] text-[var(--ink-muted)]">{order.vehiclePlate}</p></td>
                <td className="px-3 py-3"><ReportOrderStatusBadge status={order.status} /></td>
                <td className="px-3 py-3 text-sm">{order.responsibleName}</td>
                <td className="px-4 py-3 text-right font-display font-bold tabular-nums text-[var(--brand)]">{formatOrderMoney(order.total)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      {result.totalPages > 1 && (
        <nav aria-label="Paginação do relatório" className="report-no-print mt-3 flex flex-col items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-sm sm:flex-row">
          <p className="text-[var(--ink-muted)]">Página <strong className="text-[var(--ink)]">{result.page}</strong> de <strong className="text-[var(--ink)]">{result.totalPages}</strong></p>
          <div className="flex gap-2">
            {result.page > 1 ? <Link className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 font-semibold text-[var(--brand)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href={ordersPeriodReportUrl(filters, result.page - 1)}><ChevronLeft aria-hidden="true" className="size-4" /> Anterior</Link> : <span aria-disabled="true" className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 text-slate-400"><ChevronLeft aria-hidden="true" className="size-4" /> Anterior</span>}
            {result.page < result.totalPages ? <Link className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 font-semibold text-[var(--brand)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href={ordersPeriodReportUrl(filters, result.page + 1)}>Próxima <ChevronRight aria-hidden="true" className="size-4" /></Link> : <span aria-disabled="true" className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 text-slate-400">Próxima <ChevronRight aria-hidden="true" className="size-4" /></span>}
          </div>
        </nav>
      )}
    </div>
  );
}
