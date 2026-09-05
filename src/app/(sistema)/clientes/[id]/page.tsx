import {
  ArrowLeft,
  CalendarClock,
  CarFront,
  Contact,
  FileText,
  MapPin,
  Pencil,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { ClientStatusAction } from "@/features/clientes/components/client-status-action";
import {
  formatCpf,
  formatDate,
  formatPhone,
  formatZipCode,
} from "@/features/clientes/formatters";
import { getClientById } from "@/features/clientes/queries";
import { requirePermission } from "@/lib/auth/guards";

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[0.05em] text-[var(--ink-faint)]">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-[var(--ink)]">
        {value || "Não informado"}
      </dd>
    </div>
  );
}

function Section({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  icon: typeof UserRound;
  title: string;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
      <div className="flex items-center gap-3 border-b px-4 py-3.5">
        <Icon aria-hidden="true" className="size-5 text-[var(--action)]" />
        <h2 className="font-display text-lg font-bold text-[var(--brand)]">{title}</h2>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export default async function ClientDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("clientes:consultar");
  const [{ id }, messages] = await Promise.all([params, searchParams]);
  const client = await getClientById(id);
  if (!client) notFound();

  const successMessage = messages.criado
    ? "Cliente cadastrado com sucesso."
    : messages.atualizado
      ? "Dados do cliente atualizados com sucesso."
      : messages.situacao === "inativado"
        ? "Cliente inativado. O histórico foi preservado."
        : messages.situacao === "reativado"
          ? "Cliente reativado com sucesso."
          : null;

  return (
    <AppShell
      currentPath={`/clientes/${id}`}
      description="Consulte os dados e o histórico cadastral"
      title="Detalhes do cliente"
      user={user}
    >
      <div className="min-h-[calc(100dvh-5.35rem)] px-3 py-3 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-6xl">
          {successMessage && (
            <p className="mb-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-[var(--success)]" role="status">
              {successMessage}
            </p>
          )}
          {messages.erro && (
            <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-[var(--danger)]" role="alert">
              Não foi possível alterar a situação do cliente.
            </p>
          )}

          <section className="mb-3 flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-[0_2px_8px_rgba(16,45,63,0.04)] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                className="grid size-12 shrink-0 place-items-center rounded-full bg-teal-50 text-[var(--action)]"
              >
                <UserRound className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-2xl font-bold text-[var(--brand)]">
                    {client.name}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                      client.active
                        ? "bg-green-50 text-[var(--success)]"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
                    {client.active ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-[var(--ink-muted)]">
                  CPF {formatCpf(client.cpf)}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                href={`/clientes/${client.id}/editar`}
              >
                <Pencil aria-hidden="true" className="size-4" /> Editar
              </Link>
              <ClientStatusAction clientId={client.id} currentActive={client.active} />
            </div>
          </section>

          <div className="grid items-start gap-3 lg:grid-cols-2">
            <div className="space-y-3">
              <Section icon={Contact} title="Contato">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <DetailItem label="Telefone principal" value={formatPhone(client.primaryPhone)} />
                  <DetailItem
                    label="Telefone alternativo"
                    value={client.alternatePhone ? formatPhone(client.alternatePhone) : null}
                  />
                  <div className="sm:col-span-2"><DetailItem label="E-mail" value={client.email} /></div>
                </dl>
              </Section>

              <Section icon={MapPin} title="Endereço">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <DetailItem label="CEP" value={formatZipCode(client.zipCode)} />
                  <DetailItem label="Logradouro" value={`${client.street}, ${client.number}`} />
                  <DetailItem label="Complemento" value={client.complement} />
                  <DetailItem label="Bairro" value={client.neighborhood} />
                  <DetailItem label="Cidade/UF" value={`${client.city}/${client.state}`} />
                </dl>
              </Section>
            </div>

            <div className="space-y-3">
              <Section icon={FileText} title="Informações adicionais">
                <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--ink)]">
                  {client.notes || "Nenhuma observação registrada."}
                </p>
              </Section>

              <Section icon={CarFront} title="Veículos do cliente">
                <div className="rounded-lg border border-dashed bg-[var(--surface-subtle)] px-4 py-7 text-center">
                  <CarFront aria-hidden="true" className="mx-auto size-7 text-[var(--ink-faint)]" />
                  <p className="mt-2 text-sm font-semibold text-[var(--brand)]">
                    Cadastro de veículos será a próxima etapa
                  </p>
                  <p className="mt-1 text-xs text-[var(--ink-muted)]">
                    Os veículos vinculados aparecerão aqui sem alterar este cadastro.
                  </p>
                </div>
              </Section>

              <Section icon={CalendarClock} title="Registro">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <DetailItem label="Cadastrado em" value={formatDate(client.createdAt)} />
                  <DetailItem label="Atualizado em" value={formatDate(client.updatedAt)} />
                </dl>
              </Section>
            </div>
          </div>

          <Link
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-[var(--brand)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
            href="/clientes"
          >
            <ArrowLeft aria-hidden="true" className="size-4" /> Voltar para clientes
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
