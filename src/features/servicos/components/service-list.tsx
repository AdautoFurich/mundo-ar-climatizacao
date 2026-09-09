import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  SearchX,
  Wrench,
} from "lucide-react";
import Link from "next/link";

import { formatBasePrice, formatServiceCategory } from "../formatters";
import type {
  ServiceCategoryFilter,
  ServiceListResult,
  ServiceStatusFilter,
  ServiceSummary,
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

function CategoryLabel({ service }: { service: ServiceSummary }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-teal-100 bg-teal-50 px-2 py-1 text-xs font-bold text-[var(--action)]">
      <Wrench aria-hidden="true" className="size-3.5" />
      {formatServiceCategory(service.category)}
    </span>
  );
}

function ActionLinks({
  canManage,
  service,
}: {
  canManage: boolean;
  service: ServiceSummary;
}) {
  return (
    <div className="flex items-center gap-1">
      <Link
        aria-label={`Ver detalhes de ${service.name}`}
        className="grid size-11 place-items-center rounded-lg text-[var(--brand)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
        href={`/servicos/${service.id}`}
        title="Ver detalhes"
      >
        <Eye aria-hidden="true" className="size-4" />
      </Link>
      {canManage && (
        <Link
          aria-label={`Editar ${service.name}`}
          className="grid size-11 place-items-center rounded-lg text-[var(--action)] hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
          href={`/servicos/${service.id}/editar`}
          title="Editar serviço"
        >
          <Pencil aria-hidden="true" className="size-4" />
        </Link>
      )}
    </div>
  );
}

function ServiceCard({
  canManage,
  service,
}: {
  canManage: boolean;
  service: ServiceSummary;
}) {
  return (
    <article className="min-w-0 overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
      <div className="h-1 bg-[var(--action)]" />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <Link
              className="font-display text-lg font-bold text-[var(--brand)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
              href={`/servicos/${service.id}`}
            >
              {service.name}
            </Link>
            <div className="mt-2">
              <CategoryLabel service={service} />
            </div>
          </div>
          <StatusBadge active={service.active} />
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-5 text-[var(--ink-muted)]">
          {service.description || "Sem descrição cadastrada."}
        </p>
        <div className="mt-4 flex items-center justify-between border-t pt-2">
          <p className="text-base font-bold tabular-nums text-[var(--brand)]">
            {formatBasePrice(service.basePrice)}
          </p>
          <ActionLinks canManage={canManage} service={service} />
        </div>
      </div>
    </article>
  );
}

function pageUrl({
  category,
  page,
  search,
  status,
}: {
  category: ServiceCategoryFilter;
  page: number;
  search: string;
  status: ServiceStatusFilter;
}) {
  const params = new URLSearchParams();
  if (search) params.set("busca", search);
  if (category !== "todas") params.set("categoria", category);
  if (status !== "ativos") params.set("situacao", status);
  if (page > 1) params.set("pagina", String(page));
  const query = params.toString();
  return query ? `/servicos?${query}` : "/servicos";
}

export function ServiceList({
  canManage,
  category,
  result,
  search,
  status,
}: {
  canManage: boolean;
  category: ServiceCategoryFilter;
  result: ServiceListResult;
  search: string;
  status: ServiceStatusFilter;
}) {
  if (result.services.length === 0) {
    return (
      <div className="rounded-xl border bg-white px-5 py-16 text-center shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
        <span
          aria-hidden="true"
          className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--surface-subtle)] text-[var(--ink-faint)]"
        >
          <SearchX className="size-6" />
        </span>
        <h2 className="mt-4 font-display text-xl font-bold text-[var(--brand)]">
          {search || category !== "todas" || status !== "ativos"
            ? "Nenhum serviço encontrado"
            : "Nenhum serviço cadastrado"}
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-[var(--ink-muted)]">
          {search || category !== "todas" || status !== "ativos"
            ? "Ajuste a busca ou os filtros para consultar outros serviços."
            : canManage
              ? "Cadastre o primeiro serviço para iniciar o catálogo da oficina."
              : "O administrador ainda não cadastrou serviços no catálogo."}
        </p>
        {(search || category !== "todas" || status !== "ativos") && (
          <Link
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
            href="/servicos"
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
        {result.services.map((service) => (
          <ServiceCard
            canManage={canManage}
            key={service.id}
            service={service}
          />
        ))}
      </div>

      <section className="hidden overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)] md:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Serviços cadastrados na oficina</caption>
          <thead>
            <tr className="border-b bg-[var(--surface-subtle)] text-2xs font-bold uppercase tracking-[0.06em] text-[var(--ink-faint)]">
              <th className="px-4 py-3" scope="col">Serviço</th>
              <th className="px-3 py-3" scope="col">Categoria</th>
              <th className="px-3 py-3" scope="col">Valor-base</th>
              <th className="px-3 py-3" scope="col">Situação</th>
              <th className="px-3 py-3 text-center" scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            {result.services.map((service) => (
              <tr
                className="border-b last:border-0 hover:bg-[var(--surface-subtle)]"
                key={service.id}
              >
                <td className="max-w-xl px-4 py-3">
                  <Link
                    className="font-semibold text-[var(--brand)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                    href={`/servicos/${service.id}`}
                  >
                    {service.name}
                  </Link>
                  <p className="mt-0.5 line-clamp-1 text-xs text-[var(--ink-muted)]">
                    {service.description || "Sem descrição cadastrada."}
                  </p>
                </td>
                <td className="px-3 py-3"><CategoryLabel service={service} /></td>
                <td className="px-3 py-3 text-sm font-bold tabular-nums text-[var(--brand)]">
                  {formatBasePrice(service.basePrice)}
                </td>
                <td className="px-3 py-3"><StatusBadge active={service.active} /></td>
                <td className="px-3 py-3">
                  <div className="flex justify-center">
                    <ActionLinks canManage={canManage} service={service} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <nav
        aria-label="Paginação de serviços"
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
              href={pageUrl({ category, page: result.page - 1, search, status })}
            >
              <ChevronLeft aria-hidden="true" className="size-4" /> Anterior
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 text-slate-400"
            >
              <ChevronLeft aria-hidden="true" className="size-4" /> Anterior
            </span>
          )}
          {result.page < result.totalPages ? (
            <Link
              className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 font-semibold text-[var(--brand)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
              href={pageUrl({ category, page: result.page + 1, search, status })}
            >
              Próxima <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 text-slate-400"
            >
              Próxima <ChevronRight aria-hidden="true" className="size-4" />
            </span>
          )}
        </div>
      </nav>
    </>
  );
}
