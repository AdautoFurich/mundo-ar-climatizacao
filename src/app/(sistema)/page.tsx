import {
  ArrowRight,
  CarFront,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardPlus,
  MoreVertical,
  PackageOpen,
  Phone,
  Search,
  Timer,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  UserPlus,
  Wrench,
  Clock3,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";

const metrics = [
  { label: "Em diagnóstico", value: "4", helper: "veículos em análise", trend: "+1 desde ontem", icon: Search, tone: "blue" },
  { label: "Aguardando aprovação", value: "3", helper: "orçamentos pendentes", trend: "+2 desde ontem", icon: Clock3, tone: "amber" },
  { label: "Em execução", value: "5", helper: "serviços em andamento", trend: "+1 desde ontem", icon: Wrench, tone: "teal" },
  { label: "Prontas para retirada", value: "2", helper: "aguardando o cliente", trend: "+1 desde ontem", icon: CheckCircle2, tone: "green" },
  { label: "Atrasadas", value: "2", helper: "com prazo excedido", trend: "+1 desde ontem", icon: TriangleAlert, tone: "red" },
] as const;

const toneClasses = {
  blue: { icon: "bg-blue-50 text-blue-700", trend: "text-blue-700" },
  amber: { icon: "bg-amber-50 text-[var(--warning)]", trend: "text-[var(--warning)]" },
  teal: { icon: "bg-teal-50 text-teal-700", trend: "text-teal-700" },
  green: { icon: "bg-green-50 text-[var(--success)]", trend: "text-[var(--success)]" },
  red: { icon: "bg-red-50 text-[var(--danger)]", trend: "text-[var(--danger)]" },
} as const;

const orders = [
  {
    id: "#0148", priority: "Prioridade média", priorityClass: "text-[var(--warning)]",
    vehicle: "Chevrolet Onix", plate: "ABC1D23", year: "2019/2020",
    customer: "Marcos Silva", phone: "(44) 99912-3456",
    entry: "01/09/2026", entryTime: "08:30", due: "03/09/2026", dueTime: "15:00",
    status: "Em execução", statusClass: "bg-teal-50 text-teal-800 ring-teal-700/15", responsible: "João Carlos",
  },
  {
    id: "#0147", priority: "Prioridade alta", priorityClass: "text-[var(--danger)]",
    vehicle: "Toyota Corolla", plate: "DEF4G56", year: "2018/2019",
    customer: "Ana Souza", phone: "(44) 99876-5432",
    entry: "01/09/2026", entryTime: "09:15", due: "02/09/2026", dueTime: "14:00",
    status: "Em diagnóstico", statusClass: "bg-blue-50 text-blue-800 ring-blue-700/15", responsible: "Rafael Lima",
  },
  {
    id: "#0146", priority: "Prioridade baixa", priorityClass: "text-[var(--success)]",
    vehicle: "Hyundai HB20", plate: "GHI7J89", year: "2021/2021",
    customer: "Paulo Lima", phone: "(44) 99765-4321",
    entry: "31/08/2026", entryTime: "16:40", due: "02/09/2026", dueTime: "10:00",
    status: "Pronta", statusClass: "bg-green-50 text-green-800 ring-green-700/15", responsible: "João Carlos",
  },
  {
    id: "#0145", priority: "Prioridade média", priorityClass: "text-[var(--warning)]",
    vehicle: "Fiat Strada", plate: "JKL8M90", year: "2020/2021",
    customer: "Carlos Oliveira", phone: "(44) 99922-1111",
    entry: "31/08/2026", entryTime: "10:20", due: "03/09/2026", dueTime: "09:00",
    status: "Aguardando aprovação", statusClass: "bg-amber-50 text-amber-700 ring-amber-600/15", responsible: "Rafael Lima",
  },
  {
    id: "#0144", priority: "Atrasada", priorityClass: "text-[var(--danger)]",
    vehicle: "VW Gol", plate: "QWE2R34", year: "2016/2017",
    customer: "Juliana Martins", phone: "(44) 99654-3322",
    entry: "30/08/2026", entryTime: "14:10", due: "31/08/2026", dueTime: "18:00",
    status: "Atrasada", statusClass: "bg-red-50 text-red-700 ring-red-600/15", responsible: "João Carlos",
  },
] as const;

const quickStats = [
  { label: "OS abertas hoje", value: "14", trend: "+3 desde ontem", tone: "green", icon: ClipboardPlus },
  { label: "OS concluídas hoje", value: "7", trend: "+2 desde ontem", tone: "green", icon: ClipboardCheck },
  { label: "Ticket médio", value: "R$ 487,50", trend: "+8% vs. ontem", tone: "green", icon: CircleDollarSign },
  { label: "Tempo médio em diagnóstico", value: "1h 42m", trend: "-15m vs. ontem", tone: "blue", icon: Timer },
  { label: "Veículos aguardando peça", value: "3", trend: "+1 desde ontem", tone: "amber", icon: PackageOpen },
] as const;

const pendingItems = [
  { title: "OS #0145 aguarda aprovação", detail: "Orçamento enviado há 2 dias.", age: "Há 2 dias", action: "Aprovar orçamento" },
  { title: "OS #0142 está pronta", detail: "Veículo aguarda retirada desde ontem.", age: "Há 1 dia", action: "Preparar entrega" },
  { title: "OS #0144 está atrasada", detail: "Prazo excedido em 1 dia.", age: "1 dia atrasado", action: "Ver ordem" },
] as const;

const nextActions = [
  { title: "Ligar para cliente Marcos Silva", detail: "OS #0148", icon: Phone },
  { title: "Aprovar orçamento da OS #0145", detail: "Aguardando confirmação", icon: CheckCircle2 },
  { title: "Preparar retirada da OS #0142", detail: "Veículo concluído", icon: CarFront },
  { title: "Atualizar diagnóstico do Onix", detail: "OS #0148", icon: Wrench },
] as const;

function MetricCard({ metric }: { metric: (typeof metrics)[number] }) {
  const Icon = metric.icon;
  const colors = toneClasses[metric.tone];
  return (
    <article className="group rounded-xl border bg-white p-4 shadow-[0_2px_8px_rgba(16,45,63,0.045)] transition-shadow hover:shadow-[0_8px_22px_rgba(16,45,63,0.08)]">
      <div className="flex items-start gap-3">
        <div aria-hidden="true" className={cn("grid size-11 shrink-0 place-items-center rounded-full", colors.icon)}>
          <Icon className="size-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-bold uppercase leading-4 tracking-[0.04em] text-[var(--ink-muted)]">{metric.label}</p>
            <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-[var(--ink-faint)]" />
          </div>
          <p className="mt-1 text-3xl font-bold leading-none tracking-tight text-[var(--brand)]">{metric.value}</p>
          <p className="mt-1.5 text-xs text-[var(--ink-muted)]">{metric.helper}</p>
          <p className={cn("mt-2 flex items-center gap-1 text-xs font-semibold", colors.trend)}>
            <TrendingUp aria-hidden="true" className="size-3.5" />{metric.trend}
          </p>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ className, children }: { className: string; children: string }) {
  return (
    <span className={cn("inline-flex max-w-36 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold leading-3 ring-1 ring-inset", className)}>
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />{children}
    </span>
  );
}

function OrdersTable() {
  return (
    <section className="overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
      <div className="flex items-center justify-between border-b px-4 py-3.5">
        <h2 className="text-base font-bold text-[var(--brand)]">Ordens recentes</h2>
        <button aria-disabled="true" className="flex min-h-8 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-blue-700 disabled:opacity-100" disabled type="button">
          Ver todas <ArrowRight aria-hidden="true" className="size-3.5" />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] border-collapse text-left">
          <caption className="sr-only">Dados demonstrativos das ordens de serviço recentes</caption>
          <thead>
            <tr className="border-b bg-[var(--surface-subtle)] text-2xs font-bold uppercase tracking-[0.06em] text-[var(--ink-faint)]">
              <th className="px-4 py-2.5" scope="col">Ordem</th>
              <th className="px-3 py-2.5" scope="col">Veículo</th>
              <th className="px-3 py-2.5" scope="col">Cliente</th>
              <th className="px-3 py-2.5" scope="col">Data entrada</th>
              <th className="px-3 py-2.5" scope="col">Previsão</th>
              <th className="px-3 py-2.5" scope="col">Situação</th>
              <th className="px-3 py-2.5" scope="col">Responsável</th>
              <th className="px-3 py-2.5 text-center" scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr className="border-b last:border-b-0 hover:bg-[var(--surface-subtle)]" key={order.id}>
                <td className="px-4 py-2.5">
                  <p className="text-sm font-bold text-[var(--brand)]">{order.id}</p>
                  <p className={cn("mt-0.5 text-2xs font-semibold", order.priorityClass)}>{order.priority}</p>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <CarFront aria-hidden="true" className="size-4 shrink-0 text-[var(--ink-faint)]" />
                    <div><p className="text-xs font-semibold text-[var(--ink)]">{order.vehicle}</p><p className="text-xs text-[var(--ink-muted)]">{order.plate}</p><p className="text-xs text-[var(--ink-muted)]">{order.year}</p></div>
                  </div>
                </td>
                <td className="px-3 py-2.5"><p className="text-xs font-medium text-[var(--ink)]">{order.customer}</p><p className="mt-0.5 text-xs text-[var(--ink-muted)]">{order.phone}</p></td>
                <td className="px-3 py-2.5 text-xs text-[var(--ink)]"><p>{order.entry}</p><p className="text-[var(--ink-muted)]">{order.entryTime}</p></td>
                <td className={cn("px-3 py-2.5 text-xs", order.status === "Atrasada" ? "font-semibold text-[var(--danger)]" : "text-[var(--ink)]")}><p>{order.due}</p><p>{order.dueTime}</p></td>
                <td className="px-3 py-2.5"><StatusBadge className={order.statusClass}>{order.status}</StatusBadge></td>
                <td className="px-3 py-2.5 text-xs text-[var(--ink)]">{order.responsible}</td>
                <td className="px-3 py-2.5 text-center">
                  <button aria-label={"Ações da ordem " + order.id} className="inline-grid size-8 place-items-center rounded-md border text-[var(--brand)]" disabled title="Disponível quando o módulo de ordens for implementado" type="button">
                    <MoreVertical aria-hidden="true" className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="flex min-h-8 w-full items-center justify-center gap-2 border-t text-xs font-medium text-[var(--ink-muted)]" disabled type="button">
        Carregar mais <ChevronDown aria-hidden="true" className="size-3.5" />
      </button>
    </section>
  );
}

function QuickStat({ item, index }: { item: (typeof quickStats)[number]; index: number }) {
  const Icon = item.icon;
  const color = item.tone === "amber" ? "text-[var(--warning)] bg-amber-50" : item.tone === "blue" ? "text-blue-600 bg-blue-50" : "text-[var(--success)] bg-green-50";
  return (
    <article className="rounded-xl border bg-white p-3 shadow-[0_2px_8px_rgba(16,45,63,0.035)]">
      <div className="flex items-start justify-between gap-2">
        <div><p className="text-xs font-semibold text-[var(--ink-muted)]">{item.label}</p><p className="mt-1 text-xl font-bold tracking-tight text-[var(--brand)]">{item.value}</p></div>
        <div aria-hidden="true" className={cn("grid size-7 place-items-center rounded-full", color)}><Icon className="size-3.5" /></div>
      </div>
      <div className="mt-1.5 flex items-end justify-between gap-2">
        <p className={cn("text-2xs font-semibold", color.split(" ")[0])}>
          {item.tone === "blue" ? <TrendingDown aria-hidden="true" className="mr-0.5 inline size-3" /> : <TrendingUp aria-hidden="true" className="mr-0.5 inline size-3" />}{item.trend}
        </p>
        <svg aria-hidden="true" className={cn("h-7 w-16", color.split(" ")[0])} viewBox="0 0 64 28">
          <polyline fill="none" points={index % 2 === 0 ? "1,24 10,22 18,25 27,10 36,23 45,19 54,5 63,11" : "1,24 12,22 21,12 30,24 41,20 50,8 63,14"} stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    </article>
  );
}

function AttentionPanel() {
  return (
    <section className="overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
      <div className="flex items-center gap-3 border-b border-red-100 bg-red-50/70 px-4 py-3">
        <TriangleAlert aria-hidden="true" className="size-5 shrink-0 text-[var(--danger)]" />
        <div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--danger)]">Ação necessária</p><p className="text-xs font-medium text-[var(--ink)]">Precisam de atenção agora</p></div>
        <span className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-[var(--danger)]">4 itens</span>
      </div>
      <ol className="divide-y px-4">
        {pendingItems.map((item) => (
          <li className="py-3" key={item.title}>
            <div className="flex gap-3">
              <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-[var(--brand)]">{item.title}</p><p className="mt-0.5 text-xs text-[var(--ink-muted)]">{item.detail}</p><button className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-[var(--action)]" disabled type="button">{item.action}<ArrowRight aria-hidden="true" className="size-3" /></button></div>
              <span className="shrink-0 text-2xs font-semibold text-[var(--danger)]">{item.age}</span>
            </div>
          </li>
        ))}
      </ol>
      <div className="px-4 pb-3"><button className="flex min-h-8 w-full items-center justify-center gap-2 rounded-md border text-xs font-medium text-[var(--ink-muted)]" disabled type="button">Ver todas as pendências<ArrowRight aria-hidden="true" className="size-3" /></button></div>
    </section>
  );
}

function NextActionsPanel() {
  return (
    <section className="rounded-xl border bg-white p-4 shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
      <h2 className="text-sm font-bold text-[var(--brand)]">Próximas ações</h2>
      <ul className="mt-2 space-y-1.5">
        {nextActions.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.title}><button className="flex min-h-10 w-full items-center gap-2.5 rounded-md border px-2.5 text-left disabled:opacity-100" disabled type="button">
              <Icon aria-hidden="true" className="size-4 shrink-0 text-[var(--ink-faint)]" />
              <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-[var(--brand)]">{item.title}</span><span className="block text-2xs text-[var(--ink-muted)]">{item.detail}</span></span>
              <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-md border border-teal-200 bg-teal-50 text-[var(--action)]"><Icon className="size-3.5" /></span>
            </button></li>
          );
        })}
      </ul>
      <button className="mt-2 flex min-h-8 w-full items-center justify-center gap-2 rounded-md border text-xs font-medium text-[var(--ink-muted)]" disabled type="button">Ver todas as tarefas<ArrowRight aria-hidden="true" className="size-3" /></button>
    </section>
  );
}

export default async function Home() {
  const user = await requireUser();
  return (
    <AppShell
      currentPath="/"
      description="Acompanhe o desempenho da oficina em tempo real"
      title="Visão geral"
      user={user}
    >
      <div className="min-h-[calc(100dvh-5.35rem)] px-3 py-3 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[96rem]">
          <section className="flex flex-wrap items-center justify-end gap-2.5 pb-3">
            <Button className="disabled:opacity-100" disabled type="button"><ClipboardPlus aria-hidden="true" className="size-4" />Nova ordem de serviço</Button>
            <Button className="disabled:opacity-100" disabled type="button" variant="secondary"><UserPlus aria-hidden="true" className="size-4" />Novo cliente</Button>
          </section>
          <section aria-labelledby="resumo-operacional">
            <h2 className="sr-only" id="resumo-operacional">Resumo operacional</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">{metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</div>
          </section>
          <div className="mt-3 grid items-start gap-3 xl:grid-cols-[minmax(0,2.25fr)_minmax(19rem,0.95fr)]">
            <div className="min-w-0 space-y-3">
              <OrdersTable />
              <section aria-label="Indicadores rápidos" className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">{quickStats.map((item, index) => <QuickStat index={index} item={item} key={item.label} />)}</section>
            </div>
            <aside className="space-y-3"><AttentionPanel /><NextActionsPanel /></aside>
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-3 px-0.5 pb-1 pt-5 text-xs text-[var(--ink-muted)]">
            <span>Mundo Ar Climatização © 2026 • Sistema de Gestão da Oficina</span><span className="tabular-nums">Versão 0.1.0</span>
          </footer>
        </div>
      </div>
    </AppShell>
  );
}