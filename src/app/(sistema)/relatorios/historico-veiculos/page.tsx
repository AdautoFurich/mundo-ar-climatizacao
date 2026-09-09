import { Filter, History, TriangleAlert, X } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { PrintReportButton } from "@/features/relatorios/components/print-report-button";
import { ReportsNavigation } from "@/features/relatorios/components/reports-navigation";
import { VehicleMaintenanceHistoryReport } from "@/features/relatorios/components/vehicle-maintenance-history-report";
import { parseVehicleMaintenanceHistoryFilters } from "@/features/relatorios/query-helpers";
import {
  listReportVehicles,
  listVehicleMaintenanceHistory,
} from "@/features/relatorios/queries";
import type {
  ReportVehicleOption,
  VehicleMaintenanceHistoryResult,
} from "@/features/relatorios/types";
import { requirePermission } from "@/lib/auth/guards";

const REPORT_PATH = "/relatorios/historico-veiculos";

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

const inputClassName =
  "mt-1.5 min-h-11 w-full rounded-lg border bg-white px-3 text-base text-[var(--ink)] outline-none focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/20";

const emptyResult: VehicleMaintenanceHistoryResult = {
  maintenances: [],
  total: 0,
  totalValue: 0,
  latestMileage: null,
  page: 1,
  pageSize: 15,
  totalPages: 1,
};

export default async function VehicleMaintenanceHistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("relatorios:consultar");
  const params = await searchParams;
  const filters = parseVehicleMaintenanceHistoryFilters({
    page: firstValue(params.pagina),
    dateFrom: firstValue(params.de),
    dateTo: firstValue(params.ate),
    vehicleId: firstValue(params.veiculo),
  });
  const [vehiclesResult, reportResult] = await Promise.allSettled([
    listReportVehicles(),
    listVehicleMaintenanceHistory(filters),
  ]);
  const vehicles: ReportVehicleOption[] =
    vehiclesResult.status === "fulfilled" ? vehiclesResult.value : [];
  const result = reportResult.status === "fulfilled" ? reportResult.value : emptyResult;
  const loadError =
    vehiclesResult.status === "rejected" || reportResult.status === "rejected";
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === filters.vehicleId);
  const hasDateFilters = Boolean(filters.dateFrom || filters.dateTo);

  return (
    <AppShell
      currentPath={REPORT_PATH}
      description="Consulte os serviços executados ao longo da vida do veículo"
      title="Histórico dos veículos"
      user={user}
    >
      <div className="min-h-[calc(100dvh-5.35rem)] px-3 py-3 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[100rem]">
          <ReportsNavigation currentPath={REPORT_PATH} />

          <section className="report-no-print flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="grid size-10 place-items-center rounded-lg bg-teal-50 text-[var(--action)]"><History className="size-5" /></span>
              <div><p className="text-sm font-semibold text-[var(--brand)]">Histórico de manutenção</p><p className="text-xs text-[var(--ink-muted)]">Somente serviços aprovados e efetivamente executados são considerados.</p></div>
            </div>
            {result.total > 0 && <PrintReportButton />}
          </section>

          <form className="report-no-print mb-3 rounded-xl border bg-white p-4 shadow-[0_2px_8px_rgba(16,45,63,0.04)]" method="get">
            <div className="mb-3 flex items-center gap-2"><Filter aria-hidden="true" className="size-4 text-[var(--action)]" /><h2 className="font-display text-lg font-bold text-[var(--brand)]">Filtros do relatório</h2></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <label className="text-sm font-semibold" htmlFor="history-report-vehicle">Veículo <span aria-hidden="true" className="text-[var(--danger)]">*</span><select aria-required="true" className={inputClassName} defaultValue={filters.vehicleId ?? ""} id="history-report-vehicle" name="veiculo" required><option value="">Selecione pela placa</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.label}</option>)}</select></label>
              <label className="text-sm font-semibold" htmlFor="history-report-from">Data inicial<input aria-label="Data inicial" className={inputClassName} defaultValue={filters.dateFrom ?? ""} id="history-report-from" name="de" type="date" /></label>
              <label className="text-sm font-semibold" htmlFor="history-report-to">Data final<input aria-label="Data final" className={inputClassName} defaultValue={filters.dateTo ?? ""} id="history-report-to" name="ate" type="date" /></label>
            </div>
            <div className="mt-4 flex flex-col justify-end gap-2 border-t pt-4 sm:flex-row">
              {(filters.vehicleId || hasDateFilters) && <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href={REPORT_PATH}><X aria-hidden="true" className="size-4" /> Limpar filtros</Link>}
              <button className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-[var(--action)] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(15,118,110,0.18)] hover:bg-[var(--action-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2" type="submit">Gerar histórico</button>
            </div>
          </form>

          {loadError ? (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-950" role="alert"><TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" /><div><p className="font-semibold">Não foi possível gerar o histórico.</p><p className="text-sm">Atualize a página para tentar novamente.</p></div></div>
          ) : (
            <VehicleMaintenanceHistoryReport
              filters={filters}
              result={result}
              vehicleLabel={selectedVehicle?.label ?? null}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
