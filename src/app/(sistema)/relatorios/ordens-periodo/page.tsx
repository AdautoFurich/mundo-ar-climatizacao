import { BarChart3, Filter, TriangleAlert, X } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { ORDER_STATUS_LABELS } from "@/features/ordens-servico/formatters";
import { ORDER_STATUS_VALUES } from "@/features/ordens-servico/types";
import { OrdersPeriodReport } from "@/features/relatorios/components/orders-period-report";
import { PrintReportButton } from "@/features/relatorios/components/print-report-button";
import { ReportsNavigation } from "@/features/relatorios/components/reports-navigation";
import { parseOrdersPeriodReportFilters } from "@/features/relatorios/query-helpers";
import { listOrdersPeriodReport, listReportResponsibles } from "@/features/relatorios/queries";
import type { OrdersPeriodReportResult } from "@/features/relatorios/types";
import { requirePermission } from "@/lib/auth/guards";

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

const inputClassName =
  "mt-1.5 min-h-11 w-full rounded-lg border bg-white px-3 text-base text-[var(--ink)] outline-none focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/20";

export default async function OrdersPeriodReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("relatorios:consultar");
  const params = await searchParams;
  const filters = parseOrdersPeriodReportFilters({
    page: firstValue(params.pagina),
    dateFrom: firstValue(params.de),
    dateTo: firstValue(params.ate),
    status: firstValue(params.situacao),
    client: firstValue(params.cliente),
    vehicle: firstValue(params.veiculo),
    responsibleId: firstValue(params.responsavel),
  });
  const [reportResult, responsiblesResult] = await Promise.allSettled([
    listOrdersPeriodReport(filters),
    listReportResponsibles(),
  ]);
  const loadError = reportResult.status === "rejected";
  const result: OrdersPeriodReportResult =
    reportResult.status === "fulfilled"
      ? reportResult.value
      : { orders: [], total: 0, totalValue: 0, page: 1, pageSize: 15, totalPages: 1 };
  const responsibles = responsiblesResult.status === "fulfilled" ? responsiblesResult.value : [];
  const hasFilters = Boolean(
    filters.dateFrom ||
      filters.dateTo ||
      filters.status !== "todas" ||
      filters.client ||
      filters.vehicle ||
      filters.responsibleId,
  );

  return (
    <AppShell
      currentPath="/relatorios/ordens-periodo"
      description="Consulte atendimentos, responsáveis e valores em um intervalo"
      title="Ordens por período"
      user={user}
    >
      <div className="min-h-[calc(100dvh-5.35rem)] px-3 py-3 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[100rem]">
          <ReportsNavigation currentPath="/relatorios/ordens-periodo" />

          <section className="report-no-print flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="grid size-10 place-items-center rounded-lg bg-teal-50 text-[var(--action)]"><BarChart3 className="size-5" /></span>
              <div><p className="text-sm font-semibold text-[var(--brand)]">Relatório operacional</p><p className="text-xs text-[var(--ink-muted)]">Os totais consideram todas as ordens que correspondem aos filtros.</p></div>
            </div>
            {result.total > 0 && <PrintReportButton />}
          </section>

          <form className="report-no-print mb-3 rounded-xl border bg-white p-4 shadow-[0_2px_8px_rgba(16,45,63,0.04)]" method="get">
            <div className="mb-3 flex items-center gap-2"><Filter aria-hidden="true" className="size-4 text-[var(--action)]" /><h2 className="font-display text-lg font-bold text-[var(--brand)]">Filtros do relatório</h2></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <label className="text-sm font-semibold" htmlFor="report-from">Data inicial<input aria-label="Data inicial" className={inputClassName} defaultValue={filters.dateFrom ?? ""} id="report-from" name="de" type="date" /></label>
              <label className="text-sm font-semibold" htmlFor="report-to">Data final<input aria-label="Data final" className={inputClassName} defaultValue={filters.dateTo ?? ""} id="report-to" name="ate" type="date" /></label>
              <label className="text-sm font-semibold" htmlFor="report-status">Situação<select className={inputClassName} defaultValue={filters.status} id="report-status" name="situacao"><option value="todas">Todas</option>{ORDER_STATUS_VALUES.map((status) => <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>)}</select></label>
              <label className="text-sm font-semibold" htmlFor="report-client">Cliente<input className={inputClassName} defaultValue={filters.client} id="report-client" maxLength={80} name="cliente" placeholder="Nome do cliente" type="search" /></label>
              <label className="text-sm font-semibold" htmlFor="report-vehicle">Veículo<input className={inputClassName} defaultValue={filters.vehicle} id="report-vehicle" maxLength={80} name="veiculo" placeholder="Placa, marca ou modelo" type="search" /></label>
              <label className="text-sm font-semibold" htmlFor="report-responsible">Responsável<select className={inputClassName} defaultValue={filters.responsibleId ?? ""} id="report-responsible" name="responsavel"><option value="">Todos</option>{responsibles.map((responsible) => <option key={responsible.id} value={responsible.id}>{responsible.name}</option>)}</select></label>
            </div>
            <div className="mt-4 flex flex-col justify-end gap-2 border-t pt-4 sm:flex-row">
              {hasFilters && <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href="/relatorios/ordens-periodo"><X aria-hidden="true" className="size-4" /> Limpar filtros</Link>}
              <button className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-[var(--action)] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(15,118,110,0.18)] hover:bg-[var(--action-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2" type="submit">Gerar relatório</button>
            </div>
          </form>

          {loadError ? (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-950" role="alert"><TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" /><div><p className="font-semibold">Não foi possível gerar o relatório.</p><p className="text-sm">Atualize a página para tentar novamente.</p></div></div>
          ) : (
            <OrdersPeriodReport filters={filters} result={result} />
          )}
        </div>
      </div>
    </AppShell>
  );
}
