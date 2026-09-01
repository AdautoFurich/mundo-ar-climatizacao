import {
  ArrowRight,
  CarFront,
  CheckCircle2,
  ClipboardPlus,
  Clock3,
  Search,
  TriangleAlert,
  UserPlus,
  Wrench,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const metrics = [
  {
    label: "Em diagnóstico",
    value: "4",
    helper: "veículos em análise",
    icon: Search,
    tone: "default",
  },
  {
    label: "Aguardando aprovação",
    value: "3",
    helper: "orçamentos pendentes",
    icon: Clock3,
    tone: "warning",
  },
  {
    label: "Em execução",
    value: "5",
    helper: "serviços autorizados",
    icon: Wrench,
    tone: "action",
  },
  {
    label: "Prontas para retirada",
    value: "2",
    helper: "aguardando o cliente",
    icon: CheckCircle2,
    tone: "success",
  },
] as const;

const orders = [
  {
    id: "#0148",
    vehicle: "Chevrolet Onix",
    plate: "ABC1D23",
    customer: "Marcos Silva",
    status: "Em execução",
    statusClass: "bg-teal-50 text-teal-800 ring-teal-700/15",
  },
  {
    id: "#0147",
    vehicle: "Toyota Corolla",
    plate: "DEF4G56",
    customer: "Ana Souza",
    status: "Em diagnóstico",
    statusClass: "bg-sky-50 text-sky-800 ring-sky-700/15",
  },
  {
    id: "#0146",
    vehicle: "Hyundai HB20",
    plate: "GHI7J89",
    customer: "Paulo Lima",
    status: "Pronta",
    statusClass: "bg-emerald-50 text-emerald-800 ring-emerald-700/15",
  },
];

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: (typeof metrics)[number]) {
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-xl border bg-white p-5 shadow-[0_1px_2px_rgba(15,35,47,0.04)]",
        tone === "warning" && "border-l-4 border-l-[var(--warning)]",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
            {label}
          </p>
          <p className="font-display mt-3 text-4xl font-bold leading-none tracking-tight text-[var(--brand)]">
            {value}
          </p>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">{helper}</p>
        </div>
        <div
          aria-hidden="true"
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]",
            tone === "warning" &&
              "bg-[var(--warning-soft)] text-[var(--warning)]",
            tone === "action" && "bg-teal-50 text-teal-700",
            tone === "success" && "bg-emerald-50 text-emerald-700",
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  return (
    <AppShell>
      <div className="technical-grid min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-[90rem]">
          <section className="flex flex-col justify-between gap-5 border-b border-[var(--border)] pb-6 md:flex-row md:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--action)]">
                <span aria-hidden="true" className="h-px w-6 bg-current" />
                Visão geral
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--brand)] sm:text-4xl">
                Ritmo da oficina, agora
              </h1>
              <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
                Acompanhe cada veículo desde o diagnóstico até a retirada e
                aja primeiro no que está esperando.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button">
                <ClipboardPlus aria-hidden="true" className="size-4" />
                Nova ordem de serviço
              </Button>
              <Button type="button" variant="secondary">
                <UserPlus aria-hidden="true" className="size-4" />
                Novo cliente
              </Button>
            </div>
          </section>

          <section aria-labelledby="resumo-operacional" className="py-6">
            <h2 className="sr-only" id="resumo-operacional">
              Resumo operacional
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <MetricCard key={metric.label} {...metric} />
              ))}
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(20rem,0.75fr)]">
            <section className="overflow-hidden rounded-xl border bg-white shadow-[0_1px_2px_rgba(15,35,47,0.04)]">
              <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)]">
                    Fila de atendimento
                  </p>
                  <h2 className="font-display mt-1 text-xl font-bold text-[var(--brand)]">
                    Ordens recentes
                  </h2>
                </div>
                <Button size="compact" type="button" variant="ghost">
                  Ver todas
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[42rem] border-collapse text-left">
                  <caption className="sr-only">
                    Ordens de serviço abertas recentemente
                  </caption>
                  <thead>
                    <tr className="border-b bg-[var(--surface-subtle)] text-xs font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
                      <th className="px-5 py-3" scope="col">Ordem</th>
                      <th className="px-5 py-3" scope="col">Veículo</th>
                      <th className="px-5 py-3" scope="col">Cliente</th>
                      <th className="px-5 py-3" scope="col">Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        className="border-b last:border-b-0 hover:bg-[var(--surface-subtle)]"
                        key={order.id}
                      >
                        <td className="px-5 py-4 font-bold text-[var(--brand)]">
                          {order.id}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <CarFront
                              aria-hidden="true"
                              className="size-4 text-[var(--ink-faint)]"
                            />
                            <div>
                              <p className="font-semibold text-[var(--ink)]">
                                {order.vehicle}
                              </p>
                              <p className="text-xs font-semibold tracking-[0.1em] text-[var(--ink-muted)]">
                                {order.plate}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-[var(--ink-muted)]">
                          {order.customer}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset",
                              order.statusClass,
                            )}
                          >
                            <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="rounded-xl border bg-white p-5 shadow-[0_1px_2px_rgba(15,35,47,0.04)]">
              <div className="flex items-start gap-3 border-b pb-4">
                <div
                  aria-hidden="true"
                  className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--warning-soft)] text-[var(--warning)]"
                >
                  <TriangleAlert className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--warning)]">
                    Ação necessária
                  </p>
                  <h2 className="font-display mt-1 text-xl font-bold text-[var(--brand)]">
                    Precisam de atenção
                  </h2>
                </div>
              </div>

              <ol className="mt-2 divide-y">
                <li className="py-4">
                  <p className="text-sm font-semibold text-[var(--ink)]">
                    OS #0145 aguarda aprovação
                  </p>
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">
                    Orçamento enviado há 2 dias.
                  </p>
                  <button className="mt-3 text-sm font-bold text-[var(--action)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" type="button">
                    Abrir ordem
                  </button>
                </li>
                <li className="py-4">
                  <p className="text-sm font-semibold text-[var(--ink)]">
                    OS #0142 está pronta
                  </p>
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">
                    Veículo aguarda retirada desde ontem.
                  </p>
                  <button className="mt-3 text-sm font-bold text-[var(--action)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" type="button">
                    Preparar entrega
                  </button>
                </li>
              </ol>
            </aside>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
