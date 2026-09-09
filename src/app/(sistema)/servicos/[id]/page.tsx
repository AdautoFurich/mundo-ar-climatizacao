import {
  ArrowLeft,
  BadgeDollarSign,
  CalendarClock,
  FileText,
  Pencil,
  Tags,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { can } from "@/features/auth/permissions";
import { ServiceStatusAction } from "@/features/servicos/components/service-status-action";
import {
  formatBasePrice,
  formatServiceCategory,
  formatServiceDate,
} from "@/features/servicos/formatters";
import { getServiceById } from "@/features/servicos/queries";
import { requirePermission } from "@/lib/auth/guards";

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[0.05em] text-[var(--ink-faint)]">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-[var(--ink)]">
        {value}
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
  icon: typeof Wrench;
  title: string;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
      <div className="flex items-center gap-3 border-b px-4 py-3.5">
        <Icon aria-hidden="true" className="size-5 text-[var(--action)]" />
        <h2 className="font-display text-lg font-bold text-[var(--brand)]">
          {title}
        </h2>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function ServiceDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("servicos:consultar");
  const [{ id }, messages] = await Promise.all([params, searchParams]);
  const service = await getServiceById(id);
  if (!service) notFound();
  const canManage = can(user.role, "servicos:gerenciar");
  const successMessage = firstValue(messages.criado)
    ? "Serviço cadastrado com sucesso."
    : firstValue(messages.atualizado)
      ? "Dados do serviço atualizados com sucesso."
      : firstValue(messages.situacao) === "inativado"
        ? "Serviço inativado. O histórico será preservado."
        : firstValue(messages.situacao) === "reativado"
          ? "Serviço reativado com sucesso."
          : null;

  return (
    <AppShell
      currentPath={`/servicos/${id}`}
      description="Consulte a definição e o valor de referência"
      title="Detalhes do serviço"
      user={user}
    >
      <div className="min-h-[calc(100dvh-5.35rem)] px-3 py-3 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-5xl">
          {successMessage && (
            <p
              className="mb-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-[var(--success)]"
              role="status"
            >
              {successMessage}
            </p>
          )}
          {firstValue(messages.erro) && (
            <p
              className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-[var(--danger)]"
              role="alert"
            >
              Não foi possível alterar a situação do serviço.
            </p>
          )}

          <section className="mb-3 overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
            <div className="h-1.5 bg-[var(--action)]" />
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid size-12 shrink-0 place-items-center rounded-full bg-teal-50 text-[var(--action)]"
                >
                  <Wrench className="size-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-2xl font-bold text-[var(--brand)]">
                      {service.name}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                        service.active
                          ? "bg-green-50 text-[var(--success)]"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
                      {service.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[var(--action)]">
                    {formatServiceCategory(service.category)}
                  </p>
                </div>
              </div>
              {canManage && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                    href={`/servicos/${service.id}/editar`}
                  >
                    <Pencil aria-hidden="true" className="size-4" /> Editar
                  </Link>
                  <ServiceStatusAction
                    currentActive={service.active}
                    serviceId={service.id}
                  />
                </div>
              )}
            </div>
          </section>

          <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
            <div className="space-y-3">
              <Section icon={FileText} title="Descrição">
                <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--ink)]">
                  {service.description || "Nenhuma descrição registrada."}
                </p>
              </Section>
              <Section icon={CalendarClock} title="Registro">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <DetailItem
                    label="Cadastrado em"
                    value={formatServiceDate(service.createdAt)}
                  />
                  <DetailItem
                    label="Atualizado em"
                    value={formatServiceDate(service.updatedAt)}
                  />
                </dl>
              </Section>
            </div>

            <div className="space-y-3">
              <Section icon={BadgeDollarSign} title="Valor de referência">
                <p className="font-display text-3xl font-bold tabular-nums text-[var(--brand)]">
                  {formatBasePrice(service.basePrice)}
                </p>
                <p className="mt-2 text-xs leading-5 text-[var(--ink-muted)]">
                  Sugestão para novos orçamentos. O valor praticado poderá ser
                  ajustado na ordem de serviço.
                </p>
              </Section>
              <Section icon={Tags} title="Classificação">
                <dl>
                  <DetailItem
                    label="Categoria"
                    value={formatServiceCategory(service.category)}
                  />
                </dl>
              </Section>
            </div>
          </div>

          <Link
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-[var(--brand)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
            href="/servicos"
          >
            <ArrowLeft aria-hidden="true" className="size-4" /> Voltar para
            serviços
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
