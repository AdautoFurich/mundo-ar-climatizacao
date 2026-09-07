import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  SearchX,
  Trophy,
  Wrench,
} from "lucide-react";
import Link from "next/link";

import { formatOrderMoney } from "@/features/ordens-servico/formatters";
import { formatServiceCategory } from "@/features/servicos/formatters";
import { mostPerformedServicesReportUrl } from "../query-helpers";
import type {
  MostPerformedServiceReportRow,
  MostPerformedServicesReportFilters,
  MostPerformedServicesReportResult,
} from "../types";

function formatQuantity(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(value);
}

function ServiceCard({ rank, service }: { rank: number; service: MostPerformedServiceReportRow }) {
  return (
    <article className="rounded-xl border bg-white p-4 shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-50 font-display text-lg font-bold text-[var(--action)]">
          {rank}
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold text-[var(--brand)]">{service.serviceName}</h3>
          <p className="text-xs text-[var(--ink-muted)]">{formatServiceCategory(service.category)}</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 border-t pt-3 text-sm">
        <div><dt className="text-xs text-[var(--ink-muted)]">Quantidade</dt><dd className="font-bold tabular-nums">{formatQuantity(service.quantity)}</dd></div>
        <div><dt className="text-xs text-[var(--ink-muted)]">Ordens</dt><dd className="font-bold tabular-nums">{service.ordersCount}</dd></div>
        <div className="text-right"><dt className="text-xs text-[var(--ink-muted)]">Valor</dt><dd className="font-bold tabular-nums text-[var(--brand)]">{formatOrderMoney(service.totalValue)}</dd></div>
      </dl>
    </article>
  );
}

export function MostPerformedServicesReport({
  filters,
  result,
}: {
  filters: MostPerformedServicesReportFilters;
  result: MostPerformedServicesReportResult;
}) {
  if (result.totalServices === 0) {
    return (
      <div className="rounded-xl border bg-white px-5 py-16 text-center shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
        <span aria-hidden="true" className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--surface-subtle)] text-[var(--ink-faint)]"><SearchX className="size-6" /></span>
        <h2 className="mt-4 font-display text-xl font-bold text-[var(--brand)]">Nenhum serviço executado encontrado</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-[var(--ink-muted)]">Ajuste o período ou os filtros. Somente serviços concluídos entram neste relatório.</p>
        <Link className="report-no-print mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href="/relatorios/servicos-mais-realizados">Limpar filtros</Link>
      </div>
    );
  }

  return (
    <div className="report-print-area">
      <div className="report-print-only hidden">
        <h2 className="font-display text-2xl font-bold">Mundo Ar Climatização</h2>
        <p>Relatório de serviços mais realizados</p>
      </div>

      <dl className="mb-3 grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
          <span aria-hidden="true" className="grid size-10 place-items-center rounded-lg bg-teal-50 text-[var(--action)]"><Wrench className="size-5" /></span>
          <div><dt className="text-xs font-semibold text-[var(--ink-muted)]">Serviços diferentes</dt><dd className="font-display text-2xl font-bold tabular-nums text-[var(--brand)]">{result.totalServices}</dd></div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
          <span aria-hidden="true" className="grid size-10 place-items-center rounded-lg bg-teal-50 text-[var(--action)]"><ClipboardCheck className="size-5" /></span>
          <div><dt className="text-xs font-semibold text-[var(--ink-muted)]">Quantidade executada</dt><dd className="font-display text-2xl font-bold tabular-nums text-[var(--brand)]">{formatQuantity(result.totalQuantity)}</dd></div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
          <span aria-hidden="true" className="grid size-10 place-items-center rounded-lg bg-teal-50 text-[var(--action)]"><Banknote className="size-5" /></span>
          <div><dt className="text-xs font-semibold text-[var(--ink-muted)]">Valor total gerado</dt><dd className="font-display text-2xl font-bold tabular-nums text-[var(--brand)]">{formatOrderMoney(result.totalValue)}</dd></div>
        </div>
      </dl>

      <div className="report-no-print grid gap-3 md:hidden">
        {result.services.map((service, index) => (
          <ServiceCard key={service.serviceId} rank={(result.page - 1) * result.pageSize + index + 1} service={service} />
        ))}
      </div>

      <section className="report-table hidden overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)] md:block">
        <div className="overflow-x-auto">
          <table aria-label="Serviços mais realizados" className="w-full min-w-[54rem] border-collapse text-left">
            <thead><tr className="border-b bg-[var(--surface-subtle)] text-2xs font-bold uppercase tracking-[0.06em] text-[var(--ink-faint)]">
              <th className="px-4 py-3" scope="col">Posição</th><th className="px-3 py-3" scope="col">Serviço</th><th className="px-3 py-3" scope="col">Categoria</th><th className="px-3 py-3 text-right" scope="col">Quantidade</th><th className="px-3 py-3 text-right" scope="col">Ordens</th><th className="px-4 py-3 text-right" scope="col">Valor gerado</th>
            </tr></thead>
            <tbody>{result.services.map((service, index) => {
              const rank = (result.page - 1) * result.pageSize + index + 1;
              return (
                <tr className="border-b last:border-0 hover:bg-[var(--surface-subtle)]" key={service.serviceId}>
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-2 font-display text-lg font-bold text-[var(--brand)]">{rank <= 3 && <Trophy aria-hidden="true" className="size-4 text-[var(--warning)]" />}{rank}º</span></td>
                  <td className="px-3 py-3 font-semibold text-[var(--ink)]">{service.serviceName}</td>
                  <td className="px-3 py-3 text-sm text-[var(--ink-muted)]">{formatServiceCategory(service.category)}</td>
                  <td className="px-3 py-3 text-right font-bold tabular-nums">{formatQuantity(service.quantity)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-[var(--ink-muted)]">{service.ordersCount}</td>
                  <td className="px-4 py-3 text-right font-display font-bold tabular-nums text-[var(--brand)]">{formatOrderMoney(service.totalValue)}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </section>

      {result.totalPages > 1 && (
        <nav aria-label="Paginação do relatório" className="report-no-print mt-3 flex flex-col items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-sm sm:flex-row">
          <p className="text-[var(--ink-muted)]">Página <strong className="text-[var(--ink)]">{result.page}</strong> de <strong className="text-[var(--ink)]">{result.totalPages}</strong></p>
          <div className="flex gap-2">
            {result.page > 1 ? <Link className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 font-semibold text-[var(--brand)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href={mostPerformedServicesReportUrl(filters, result.page - 1)}><ChevronLeft aria-hidden="true" className="size-4" /> Anterior</Link> : <span aria-disabled="true" className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 text-slate-400"><ChevronLeft aria-hidden="true" className="size-4" /> Anterior</span>}
            {result.page < result.totalPages ? <Link className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 font-semibold text-[var(--brand)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href={mostPerformedServicesReportUrl(filters, result.page + 1)}>Próxima <ChevronRight aria-hidden="true" className="size-4" /></Link> : <span aria-disabled="true" className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 text-slate-400">Próxima <ChevronRight aria-hidden="true" className="size-4" /></span>}
          </div>
        </nav>
      )}
    </div>
  );
}
