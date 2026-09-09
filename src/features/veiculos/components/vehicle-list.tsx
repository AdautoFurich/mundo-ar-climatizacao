import {
  CarFront,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  SearchX,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { formatPlate, formatVehicleYear } from "../formatters";
import type {
  VehicleListResult,
  VehicleStatusFilter,
  VehicleSummary,
} from "../types";

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
        active
          ? "bg-green-50 text-[var(--success)] ring-green-700/15"
          : "bg-slate-100 text-slate-600 ring-slate-500/15"
      }`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

function ActionLinks({ vehicle }: { vehicle: VehicleSummary }) {
  const plate = formatPlate(vehicle.plate);
  return (
    <div className="flex items-center gap-1">
      <Link
        aria-label={`Ver detalhes de ${plate}`}
        className="grid size-11 place-items-center rounded-lg text-[var(--brand)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
        href={`/veiculos/${vehicle.id}`}
        title="Ver detalhes"
      >
        <Eye aria-hidden="true" className="size-4" />
      </Link>
      <Link
        aria-label={`Editar ${plate}`}
        className="grid size-11 place-items-center rounded-lg text-[var(--action)] hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
        href={`/veiculos/${vehicle.id}/editar`}
        title="Editar veículo"
      >
        <Pencil aria-hidden="true" className="size-4" />
      </Link>
    </div>
  );
}

function VehicleCard({ vehicle }: { vehicle: VehicleSummary }) {
  return (
    <article className="min-w-0 rounded-xl border bg-white p-4 shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-teal-50 text-[var(--action)]"
        >
          <CarFront className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <Link
            className="font-display text-lg font-bold text-[var(--brand)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
            href={`/veiculos/${vehicle.id}`}
          >
            {formatPlate(vehicle.plate)}
          </Link>
          <p className="mt-0.5 text-sm font-semibold text-[var(--ink)]">
            {vehicle.brand} {vehicle.model}
          </p>
        </div>
        <StatusBadge active={vehicle.active} />
      </div>
      <dl className="mt-4 grid gap-2 text-sm">
        <div className="flex items-center gap-2">
          <CarFront aria-hidden="true" className="size-4 text-[var(--ink-faint)]" />
          <dt className="sr-only">Ano</dt>
          <dd>{formatVehicleYear(vehicle.manufactureYear, vehicle.modelYear)}</dd>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <UserRound aria-hidden="true" className="size-4 text-[var(--ink-faint)]" />
          <dt className="sr-only">Proprietário</dt>
          <dd className="truncate">{vehicle.ownerName}</dd>
        </div>
      </dl>
      <div className="mt-3 flex justify-end border-t pt-2">
        <ActionLinks vehicle={vehicle} />
      </div>
    </article>
  );
}

function pageUrl({
  page,
  search,
  status,
}: {
  page: number;
  search: string;
  status: VehicleStatusFilter;
}) {
  const params = new URLSearchParams();
  if (search) params.set("busca", search);
  if (status !== "ativos") params.set("situacao", status);
  if (page > 1) params.set("pagina", String(page));
  const query = params.toString();
  return query ? `/veiculos?${query}` : "/veiculos";
}

export function VehicleList({
  result,
  search,
  status,
}: {
  result: VehicleListResult;
  search: string;
  status: VehicleStatusFilter;
}) {
  if (result.vehicles.length === 0) {
    return (
      <div className="rounded-xl border bg-white px-5 py-16 text-center shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
        <span
          aria-hidden="true"
          className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--surface-subtle)] text-[var(--ink-faint)]"
        >
          <SearchX className="size-6" />
        </span>
        <h2 className="mt-4 font-display text-xl font-bold text-[var(--brand)]">
          {search || status !== "ativos"
            ? "Nenhum veículo encontrado"
            : "Nenhum veículo cadastrado"}
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-[var(--ink-muted)]">
          {search || status !== "ativos"
            ? "Ajuste a busca ou os filtros para consultar outros registros."
            : "Cadastre o primeiro veículo para vinculá-lo a um cliente."}
        </p>
        {(search || status !== "ativos") && (
          <Link
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
            href="/veiculos"
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
        {result.vehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>

      <section className="hidden overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)] md:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Veículos cadastrados na oficina</caption>
          <thead>
            <tr className="border-b bg-[var(--surface-subtle)] text-2xs font-bold uppercase tracking-[0.06em] text-[var(--ink-faint)]">
              <th className="px-4 py-3" scope="col">Placa</th>
              <th className="px-3 py-3" scope="col">Veículo</th>
              <th className="px-3 py-3" scope="col">Ano</th>
              <th className="px-3 py-3" scope="col">Proprietário</th>
              <th className="px-3 py-3" scope="col">Situação</th>
              <th className="px-3 py-3 text-center" scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            {result.vehicles.map((vehicle) => (
              <tr
                className="border-b last:border-0 hover:bg-[var(--surface-subtle)]"
                key={vehicle.id}
              >
                <td className="px-4 py-3">
                  <Link
                    className="font-semibold tracking-[0.05em] text-[var(--brand)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                    href={`/veiculos/${vehicle.id}`}
                  >
                    {formatPlate(vehicle.plate)}
                  </Link>
                </td>
                <td className="px-3 py-3 text-sm font-semibold text-[var(--ink)]">
                  {vehicle.brand} {vehicle.model}
                </td>
                <td className="px-3 py-3 text-sm tabular-nums text-[var(--ink)]">
                  {formatVehicleYear(vehicle.manufactureYear, vehicle.modelYear)}
                </td>
                <td className="px-3 py-3 text-sm text-[var(--ink)]">
                  <Link
                    className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                    href={`/clientes/${vehicle.ownerId}`}
                  >
                    {vehicle.ownerName}
                  </Link>
                </td>
                <td className="px-3 py-3"><StatusBadge active={vehicle.active} /></td>
                <td className="px-3 py-3">
                  <div className="flex justify-center"><ActionLinks vehicle={vehicle} /></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <nav
        aria-label="Paginação de veículos"
        className="mt-3 flex flex-col items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-sm sm:flex-row"
      >
        <p className="text-[var(--ink-muted)]">
          Página <strong className="text-[var(--ink)]">{result.page}</strong> de{" "}
          <strong className="text-[var(--ink)]">{result.totalPages}</strong>
        </p>
        <div className="flex gap-2">
          {result.page > 1 ? (
            <Link
              className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 font-semibold text-[var(--brand)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
              href={pageUrl({ page: result.page - 1, search, status })}
            >
              <ChevronLeft aria-hidden="true" className="size-4" /> Anterior
            </Link>
          ) : (
            <span className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 text-slate-400" aria-disabled="true">
              <ChevronLeft aria-hidden="true" className="size-4" /> Anterior
            </span>
          )}
          {result.page < result.totalPages ? (
            <Link
              className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 font-semibold text-[var(--brand)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
              href={pageUrl({ page: result.page + 1, search, status })}
            >
              Próxima <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          ) : (
            <span className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 text-slate-400" aria-disabled="true">
              Próxima <ChevronRight aria-hidden="true" className="size-4" />
            </span>
          )}
        </div>
      </nav>
    </>
  );
}

