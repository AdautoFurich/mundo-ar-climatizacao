import {
  Banknote,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Gauge,
  History,
  SearchX,
} from "lucide-react";
import Link from "next/link";

import {
  formatMileage,
  formatOrderDate,
  formatOrderMoney,
  formatOrderNumber,
} from "@/features/ordens-servico/formatters";
import { vehicleMaintenanceHistoryUrl } from "../query-helpers";
import type {
  VehicleMaintenanceHistoryFilters,
  VehicleMaintenanceHistoryResult,
  VehicleMaintenanceHistoryRow,
} from "../types";
import { ReportOrderStatusBadge } from "./report-order-status-badge";

function MaintenanceCard({ maintenance }: { maintenance: VehicleMaintenanceHistoryRow }) {
  return (
    <article className="rounded-xl border bg-white p-4 shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link className="font-display text-lg font-bold text-[var(--brand)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href={`/ordens-servico/${maintenance.id}`}>
            {formatOrderNumber(maintenance.number)}
          </Link>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">Entrada: {formatOrderDate(maintenance.entryAt)}</p>
        </div>
        <ReportOrderStatusBadge status={maintenance.status} />
      </div>
      <dl className="mt-4 grid gap-3 text-sm">
        <div><dt className="text-xs text-[var(--ink-muted)]">Serviços executados</dt><dd><ul className="mt-1 list-disc space-y-1 pl-5 font-semibold">{maintenance.services.map((service, index) => <li key={`${service}-${index}`}>{service}</li>)}</ul></dd></div>
        <div className="grid grid-cols-2 gap-3 border-t pt-3"><div><dt className="text-xs text-[var(--ink-muted)]">Cliente na época</dt><dd className="font-semibold">{maintenance.clientName}</dd></div><div className="text-right"><dt className="text-xs text-[var(--ink-muted)]">Quilometragem</dt><dd className="font-semibold tabular-nums">{formatMileage(maintenance.mileage)}</dd></div></div>
        <div className="flex items-end justify-between gap-3 border-t pt-3"><div><dt className="text-xs text-[var(--ink-muted)]">Entrega</dt><dd className="font-semibold">{maintenance.deliveredAt ? formatOrderDate(maintenance.deliveredAt) : "Ainda não entregue"}</dd></div><div className="text-right"><dt className="text-xs text-[var(--ink-muted)]">Valor</dt><dd className="font-display font-bold tabular-nums text-[var(--brand)]">{formatOrderMoney(maintenance.totalValue)}</dd></div></div>
      </dl>
    </article>
  );
}

export function VehicleMaintenanceHistoryReport({
  filters,
  result,
  vehicleLabel,
}: {
  filters: VehicleMaintenanceHistoryFilters;
  result: VehicleMaintenanceHistoryResult;
  vehicleLabel: string | null;
}) {
  if (!filters.vehicleId) {
    return (
      <div className="rounded-xl border bg-white px-5 py-16 text-center shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
        <span aria-hidden="true" className="mx-auto grid size-14 place-items-center rounded-full bg-teal-50 text-[var(--action)]"><CarFront className="size-6" /></span>
        <h2 className="mt-4 font-display text-xl font-bold text-[var(--brand)]">Selecione um veículo</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-[var(--ink-muted)]">Escolha o veículo nos filtros acima para consultar seu histórico de manutenção.</p>
      </div>
    );
  }

  if (result.total === 0) {
    return (
      <div className="rounded-xl border bg-white px-5 py-16 text-center shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
        <span aria-hidden="true" className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--surface-subtle)] text-[var(--ink-faint)]"><SearchX className="size-6" /></span>
        <h2 className="mt-4 font-display text-xl font-bold text-[var(--brand)]">Nenhuma manutenção encontrada</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-[var(--ink-muted)]">Este veículo não possui serviços executados no período informado.</p>
      </div>
    );
  }

  return (
    <div className="report-print-area">
      <div className="report-print-only hidden">
        <h2 className="font-display text-2xl font-bold">Mundo Ar Climatização</h2>
        <p>Histórico de manutenção · {vehicleLabel ?? "Veículo selecionado"}</p>
      </div>

      <div className="mb-3 rounded-xl border border-teal-100 bg-teal-50/70 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--action)]">Veículo consultado</p>
        <p className="mt-0.5 font-display text-lg font-bold text-[var(--brand)]">{vehicleLabel ?? "Veículo selecionado"}</p>
      </div>

      <dl className="mb-3 grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-[0_2px_8px_rgba(16,45,63,0.04)]"><span aria-hidden="true" className="grid size-10 place-items-center rounded-lg bg-teal-50 text-[var(--action)]"><History className="size-5" /></span><div><dt className="text-xs font-semibold text-[var(--ink-muted)]">Manutenções registradas</dt><dd className="font-display text-2xl font-bold tabular-nums text-[var(--brand)]">{result.total}</dd></div></div>
        <div className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-[0_2px_8px_rgba(16,45,63,0.04)]"><span aria-hidden="true" className="grid size-10 place-items-center rounded-lg bg-teal-50 text-[var(--action)]"><Gauge className="size-5" /></span><div><dt className="text-xs font-semibold text-[var(--ink-muted)]">Última quilometragem</dt><dd className="font-display text-2xl font-bold tabular-nums text-[var(--brand)]">{result.latestMileage === null ? "—" : formatMileage(result.latestMileage)}</dd></div></div>
        <div className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-[0_2px_8px_rgba(16,45,63,0.04)]"><span aria-hidden="true" className="grid size-10 place-items-center rounded-lg bg-teal-50 text-[var(--action)]"><Banknote className="size-5" /></span><div><dt className="text-xs font-semibold text-[var(--ink-muted)]">Valor acumulado</dt><dd className="font-display text-2xl font-bold tabular-nums text-[var(--brand)]">{formatOrderMoney(result.totalValue)}</dd></div></div>
      </dl>

      <div className="report-no-print grid gap-3 lg:hidden">
        {result.maintenances.map((maintenance) => <MaintenanceCard key={maintenance.id} maintenance={maintenance} />)}
      </div>

      <section className="report-table hidden overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)] lg:block">
        <div className="overflow-x-auto">
          <table aria-label="Histórico de manutenção do veículo" className="w-full min-w-[76rem] border-collapse text-left">
            <thead><tr className="border-b bg-[var(--surface-subtle)] text-2xs font-bold uppercase tracking-[0.06em] text-[var(--ink-faint)]"><th className="px-4 py-3" scope="col">Ordem</th><th className="px-3 py-3" scope="col">Entrada / entrega</th><th className="px-3 py-3" scope="col">Cliente</th><th className="px-3 py-3" scope="col">Quilometragem</th><th className="px-3 py-3" scope="col">Serviços executados</th><th className="px-3 py-3" scope="col">Situação</th><th className="px-4 py-3 text-right" scope="col">Valor</th></tr></thead>
            <tbody>{result.maintenances.map((maintenance) => (
              <tr className="border-b align-top last:border-0 hover:bg-[var(--surface-subtle)]" key={maintenance.id}>
                <td className="px-4 py-3 font-display font-bold"><Link className="text-[var(--brand)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href={`/ordens-servico/${maintenance.id}`}>{formatOrderNumber(maintenance.number)}</Link></td>
                <td className="px-3 py-3 text-sm tabular-nums"><p>{formatOrderDate(maintenance.entryAt)}</p><p className="mt-1 text-xs text-[var(--ink-muted)]">{maintenance.deliveredAt ? formatOrderDate(maintenance.deliveredAt) : "Ainda não entregue"}</p></td>
                <td className="px-3 py-3 text-sm font-medium">{maintenance.clientName}</td>
                <td className="px-3 py-3 text-sm font-semibold tabular-nums">{formatMileage(maintenance.mileage)}</td>
                <td className="px-3 py-3 text-sm"><ul className="list-disc space-y-1 pl-4">{maintenance.services.map((service, index) => <li key={`${service}-${index}`}>{service}</li>)}</ul></td>
                <td className="px-3 py-3"><ReportOrderStatusBadge status={maintenance.status} /></td>
                <td className="px-4 py-3 text-right font-display font-bold tabular-nums text-[var(--brand)]">{formatOrderMoney(maintenance.totalValue)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      {result.totalPages > 1 && (
        <nav aria-label="Paginação do relatório" className="report-no-print mt-3 flex flex-col items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-sm sm:flex-row">
          <p className="text-[var(--ink-muted)]">Página <strong className="text-[var(--ink)]">{result.page}</strong> de <strong className="text-[var(--ink)]">{result.totalPages}</strong></p>
          <div className="flex gap-2">
            {result.page > 1 ? <Link className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 font-semibold text-[var(--brand)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href={vehicleMaintenanceHistoryUrl(filters, result.page - 1)}><ChevronLeft aria-hidden="true" className="size-4" /> Anterior</Link> : <span aria-disabled="true" className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 text-slate-400"><ChevronLeft aria-hidden="true" className="size-4" /> Anterior</span>}
            {result.page < result.totalPages ? <Link className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 font-semibold text-[var(--brand)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href={vehicleMaintenanceHistoryUrl(filters, result.page + 1)}>Próxima <ChevronRight aria-hidden="true" className="size-4" /></Link> : <span aria-disabled="true" className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 text-slate-400">Próxima <ChevronRight aria-hidden="true" className="size-4" /></span>}
          </div>
        </nav>
      )}
    </div>
  );
}
