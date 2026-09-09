import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  MapPin,
  Pencil,
  Phone,
  SearchX,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { formatCpf, formatPhone } from "../formatters";
import type {
  ClientListResult,
  ClientStatusFilter,
  ClientSummary,
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

function ActionLinks({ client }: { client: ClientSummary }) {
  return (
    <div className="flex items-center gap-1">
      <Link
        aria-label={`Ver detalhes de ${client.name}`}
        className="grid size-11 place-items-center rounded-lg text-[var(--brand)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
        href={`/clientes/${client.id}`}
        title="Ver detalhes"
      >
        <Eye aria-hidden="true" className="size-4" />
      </Link>
      <Link
        aria-label={`Editar ${client.name}`}
        className="grid size-11 place-items-center rounded-lg text-[var(--action)] hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
        href={`/clientes/${client.id}/editar`}
        title="Editar cliente"
      >
        <Pencil aria-hidden="true" className="size-4" />
      </Link>
    </div>
  );
}

function ClientCard({ client }: { client: ClientSummary }) {
  return (
    <article className="min-w-0 rounded-xl border bg-white p-4 shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-teal-50 text-[var(--action)]"
        >
          <UserRound className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <Link
            className="font-display text-lg font-bold text-[var(--brand)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
            href={`/clientes/${client.id}`}
          >
            {client.name}
          </Link>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            CPF {formatCpf(client.cpf)}
          </p>
        </div>
        <StatusBadge active={client.active} />
      </div>
      <dl className="mt-4 grid gap-2 text-sm">
        <div className="flex min-w-0 items-center gap-2">
          <Phone aria-hidden="true" className="size-4 text-[var(--ink-faint)]" />
          <dt className="sr-only">Telefone</dt>
          <dd>{formatPhone(client.primaryPhone)}</dd>
        </div>
        {client.email && (
          <div className="flex min-w-0 items-center gap-2">
            <Mail aria-hidden="true" className="size-4 text-[var(--ink-faint)]" />
            <dt className="sr-only">E-mail</dt>
            <dd className="min-w-0 [overflow-wrap:anywhere]">{client.email}</dd>
          </div>
        )}
        <div className="flex min-w-0 items-center gap-2">
          <MapPin aria-hidden="true" className="size-4 text-[var(--ink-faint)]" />
          <dt className="sr-only">Cidade</dt>
          <dd>
            {client.city}/{client.state}
          </dd>
        </div>
      </dl>
      <div className="mt-3 flex justify-end border-t pt-2">
        <ActionLinks client={client} />
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
  status: ClientStatusFilter;
}) {
  const params = new URLSearchParams();
  if (search) params.set("busca", search);
  if (status !== "ativos") params.set("situacao", status);
  if (page > 1) params.set("pagina", String(page));
  const query = params.toString();
  return query ? `/clientes?${query}` : "/clientes";
}

export function ClientList({
  result,
  search,
  status,
}: {
  result: ClientListResult;
  search: string;
  status: ClientStatusFilter;
}) {
  if (result.clients.length === 0) {
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
            ? "Nenhum cliente encontrado"
            : "Nenhum cliente cadastrado"}
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-[var(--ink-muted)]">
          {search || status !== "ativos"
            ? "Ajuste a busca ou os filtros para consultar outros registros."
            : "Cadastre o primeiro cliente para iniciar o histórico de atendimentos."}
        </p>
        {(search || status !== "ativos") && (
          <Link
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
            href="/clientes"
          >
            Limpar filtros
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="min-w-0 grid gap-3 md:hidden">
        {result.clients.map((client) => (
          <ClientCard client={client} key={client.id} />
        ))}
      </div>

      <section className="hidden overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)] md:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Clientes cadastrados na oficina</caption>
          <thead>
            <tr className="border-b bg-[var(--surface-subtle)] text-2xs font-bold uppercase tracking-[0.06em] text-[var(--ink-faint)]">
              <th className="px-4 py-3" scope="col">Cliente</th>
              <th className="px-3 py-3" scope="col">CPF</th>
              <th className="px-3 py-3" scope="col">Contato</th>
              <th className="px-3 py-3" scope="col">Cidade</th>
              <th className="px-3 py-3" scope="col">Situação</th>
              <th className="px-3 py-3 text-center" scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            {result.clients.map((client) => (
              <tr className="border-b last:border-0 hover:bg-[var(--surface-subtle)]" key={client.id}>
                <td className="px-4 py-3">
                  <Link
                    className="font-semibold text-[var(--brand)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                    href={`/clientes/${client.id}`}
                  >
                    {client.name}
                  </Link>
                  {client.email && (
                    <p className="mt-0.5 max-w-64 truncate text-xs text-[var(--ink-muted)]" title={client.email}>
                      {client.email}
                    </p>
                  )}
                </td>
                <td className="px-3 py-3 text-sm tabular-nums text-[var(--ink)]">
                  {formatCpf(client.cpf)}
                </td>
                <td className="px-3 py-3 text-sm tabular-nums text-[var(--ink)]">
                  {formatPhone(client.primaryPhone)}
                  {client.alternatePhone && (
                    <p className="text-xs text-[var(--ink-muted)]">
                      {formatPhone(client.alternatePhone)}
                    </p>
                  )}
                </td>
                <td className="px-3 py-3 text-sm text-[var(--ink)]">
                  {client.city}/{client.state}
                </td>
                <td className="px-3 py-3"><StatusBadge active={client.active} /></td>
                <td className="px-3 py-3"><div className="flex justify-center"><ActionLinks client={client} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <nav
        aria-label="Paginação de clientes"
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
