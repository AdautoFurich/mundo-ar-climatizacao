import { Filter, TriangleAlert, Wrench, X } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { MostPerformedServicesReport } from "@/features/relatorios/components/most-performed-services-report";
import { PrintReportButton } from "@/features/relatorios/components/print-report-button";
import { ReportsNavigation } from "@/features/relatorios/components/reports-navigation";
import { parseMostPerformedServicesReportFilters } from "@/features/relatorios/query-helpers";
import { listMostPerformedServicesReport } from "@/features/relatorios/queries";
import type { MostPerformedServicesReportResult } from "@/features/relatorios/types";
import { SERVICE_CATEGORY_LABELS } from "@/features/servicos/formatters";
import { SERVICE_CATEGORY_VALUES } from "@/features/servicos/schemas";
import { requirePermission } from "@/lib/auth/guards";

const REPORT_PATH = "/relatorios/servicos-mais-realizados";

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

const inputClassName =
  "mt-1.5 min-h-11 w-full rounded-lg border bg-white px-3 text-base text-[var(--ink)] outline-none focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/20";

export default async function MostPerformedServicesReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("relatorios:consultar");
  const params = await searchParams;
  const filters = parseMostPerformedServicesReportFilters({
    page: firstValue(params.pagina),
    dateFrom: firstValue(params.de),
    dateTo: firstValue(params.ate),
    search: firstValue(params.busca),
    category: firstValue(params.categoria),
  });
  const reportResult = await Promise.allSettled([
    listMostPerformedServicesReport(filters),
  ]);
  const loadError = reportResult[0].status === "rejected";
  const result: MostPerformedServicesReportResult =
    reportResult[0].status === "fulfilled"
      ? reportResult[0].value
      : {
          services: [],
          totalServices: 0,
          totalOrders: 0,
          totalQuantity: 0,
          totalValue: 0,
          page: 1,
          pageSize: 15,
          totalPages: 1,
        };
  const hasFilters = Boolean(
    filters.dateFrom ||
      filters.dateTo ||
      filters.search ||
      filters.category !== "todas",
  );

  return (
    <AppShell
      currentPath={REPORT_PATH}
      description="Veja quais serviços foram mais executados e quanto geraram"
      title="Serviços mais realizados"
      user={user}
    >
      <div className="min-h-[calc(100dvh-5.35rem)] px-3 py-3 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[100rem]">
          <ReportsNavigation currentPath={REPORT_PATH} />

          <section className="report-no-print flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="grid size-10 place-items-center rounded-lg bg-teal-50 text-[var(--action)]"><Wrench className="size-5" /></span>
              <div><p className="text-sm font-semibold text-[var(--brand)]">Ranking operacional</p><p className="text-xs text-[var(--ink-muted)]">Considera somente serviços aprovados e marcados como executados.</p></div>
            </div>
            {result.totalServices > 0 && <PrintReportButton />}
          </section>

          <form className="report-no-print mb-3 rounded-xl border bg-white p-4 shadow-[0_2px_8px_rgba(16,45,63,0.04)]" method="get">
            <div className="mb-3 flex items-center gap-2"><Filter aria-hidden="true" className="size-4 text-[var(--action)]" /><h2 className="font-display text-lg font-bold text-[var(--brand)]">Filtros do relatório</h2></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <label className="text-sm font-semibold" htmlFor="services-report-from">Data inicial<input aria-label="Data inicial" className={inputClassName} defaultValue={filters.dateFrom ?? ""} id="services-report-from" name="de" type="date" /></label>
              <label className="text-sm font-semibold" htmlFor="services-report-to">Data final<input aria-label="Data final" className={inputClassName} defaultValue={filters.dateTo ?? ""} id="services-report-to" name="ate" type="date" /></label>
              <label className="text-sm font-semibold" htmlFor="services-report-search">Serviço<input className={inputClassName} defaultValue={filters.search} id="services-report-search" maxLength={80} name="busca" placeholder="Nome do serviço" type="search" /></label>
              <label className="text-sm font-semibold" htmlFor="services-report-category">Categoria<select className={inputClassName} defaultValue={filters.category} id="services-report-category" name="categoria"><option value="todas">Todas</option>{SERVICE_CATEGORY_VALUES.map((category) => <option key={category} value={category}>{SERVICE_CATEGORY_LABELS[category]}</option>)}</select></label>
            </div>
            <div className="mt-4 flex flex-col justify-end gap-2 border-t pt-4 sm:flex-row">
              {hasFilters && <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href={REPORT_PATH}><X aria-hidden="true" className="size-4" /> Limpar filtros</Link>}
              <button className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-[var(--action)] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(15,118,110,0.18)] hover:bg-[var(--action-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2" type="submit">Gerar relatório</button>
            </div>
          </form>

          {loadError ? (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-950" role="alert"><TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" /><div><p className="font-semibold">Não foi possível gerar o relatório.</p><p className="text-sm">Atualize a página para tentar novamente.</p></div></div>
          ) : (
            <MostPerformedServicesReport filters={filters} result={result} />
          )}
        </div>
      </div>
    </AppShell>
  );
}
