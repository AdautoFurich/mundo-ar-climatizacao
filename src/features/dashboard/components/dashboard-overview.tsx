import {
  ArrowRight,
  Banknote,
  CarFront,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardPlus,
  Clock3,
  Search,
  Stethoscope,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import Link from "next/link";

import {
  formatOrderDate,
  formatOrderMoney,
  formatOrderNumber,
  formatOrderStatus,
} from "@/features/ordens-servico/formatters";
import type { OrderStatus } from "@/features/ordens-servico/types";
import { cn } from "@/lib/utils";
import type {
  DashboardData,
  DashboardNextAction,
  DashboardOrder,
} from "../types";

const statusClasses: Record<OrderStatus, string> = {
  aberta: "bg-blue-50 text-blue-700 ring-blue-700/15",
  em_diagnostico: "bg-sky-50 text-sky-700 ring-sky-700/15",
  aguardando_aprovacao: "bg-amber-50 text-[var(--warning)] ring-amber-700/15",
  aprovada: "bg-teal-50 text-[var(--action)] ring-teal-700/15",
  em_execucao: "bg-cyan-50 text-cyan-800 ring-cyan-700/15",
  pronta_retirada: "bg-green-50 text-[var(--success)] ring-green-700/15",
  entregue: "bg-emerald-50 text-emerald-800 ring-emerald-700/15",
  reprovada: "bg-red-50 text-[var(--danger)] ring-red-700/15",
  cancelada: "bg-slate-100 text-slate-600 ring-slate-500/15",
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset", statusClasses[status])}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {formatOrderStatus(status)}
    </span>
  );
}

function MetricCard({
  helper,
  href,
  icon: Icon,
  label,
  tone,
  value,
}: {
  helper: string;
  href: string;
  icon: typeof Search;
  label: string;
  tone: "blue" | "amber" | "teal" | "green" | "red";
  value: number;
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-[var(--warning)]",
    teal: "bg-teal-50 text-[var(--action)]",
    green: "bg-green-50 text-[var(--success)]",
    red: "bg-red-50 text-[var(--danger)]",
  }[tone];
  return (
    <Link className="group rounded-xl border bg-white p-4 shadow-[0_2px_8px_rgba(16,45,63,0.045)] transition-shadow hover:shadow-[0_8px_22px_rgba(16,45,63,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href={href}>
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className={cn("grid size-11 shrink-0 place-items-center rounded-full", toneClass)}><Icon className="size-5" /></span>
        <div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase leading-4 tracking-[0.04em] text-[var(--ink-muted)]">{label}</p><p className="mt-1 font-display text-3xl font-bold leading-none tracking-tight text-[var(--brand)]">{value}</p><p className="mt-1.5 text-xs text-[var(--ink-muted)]">{helper}</p></div>
        <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-[var(--ink-faint)] transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function RecentOrders({ orders }: { orders: DashboardOrder[] }) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
      <div className="flex items-center justify-between border-b px-4 py-3.5"><h2 className="font-display text-lg font-bold text-[var(--brand)]">Ordens recentes</h2><Link className="inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href="/ordens-servico">Ver todas <ArrowRight aria-hidden="true" className="size-3.5" /></Link></div>
      {orders.length === 0 ? (
        <div className="px-5 py-12 text-center"><ClipboardPlus aria-hidden="true" className="mx-auto size-8 text-[var(--ink-faint)]" /><p className="mt-3 font-semibold text-[var(--brand)]">Nenhuma ordem cadastrada</p><p className="mt-1 text-sm text-[var(--ink-muted)]">As ordens criadas aparecerão aqui.</p></div>
      ) : (
        <div className="overflow-x-auto"><table className="w-full min-w-[64rem] border-collapse text-left"><caption className="sr-only">Cinco ordens de serviço mais recentes</caption><thead><tr className="border-b bg-[var(--surface-subtle)] text-2xs font-bold uppercase tracking-[0.06em] text-[var(--ink-faint)]"><th className="px-4 py-2.5" scope="col">Ordem</th><th className="px-3 py-2.5" scope="col">Veículo</th><th className="px-3 py-2.5" scope="col">Cliente</th><th className="px-3 py-2.5" scope="col">Entrada</th><th className="px-3 py-2.5" scope="col">Previsão</th><th className="px-3 py-2.5" scope="col">Situação</th><th className="px-3 py-2.5" scope="col">Responsável</th><th className="px-4 py-2.5 text-right" scope="col">Ação</th></tr></thead><tbody>{orders.map((order) => (
          <tr className="border-b last:border-0 hover:bg-[var(--surface-subtle)]" key={order.id}>
            <td className="px-4 py-3 font-display font-bold text-[var(--brand)]">{formatOrderNumber(order.number)}</td>
            <td className="px-3 py-3"><div className="flex items-center gap-2"><CarFront aria-hidden="true" className="size-4 shrink-0 text-[var(--ink-faint)]" /><div><p className="text-sm font-semibold">{order.vehicleLabel}</p><p className="text-xs text-[var(--ink-muted)]">{order.vehiclePlate} · {order.vehicleYear}</p></div></div></td>
            <td className="px-3 py-3"><p className="text-sm font-medium">{order.clientName}</p><p className="text-xs text-[var(--ink-muted)]">{order.clientPhone}</p></td>
            <td className="px-3 py-3 text-sm tabular-nums">{formatOrderDate(order.entryAt)}</td>
            <td className={cn("px-3 py-3 text-sm tabular-nums", order.overdue && "font-semibold text-[var(--danger)]")}>{order.expectedCompletionAt ? formatOrderDate(order.expectedCompletionAt) : "Não informada"}</td>
            <td className="px-3 py-3"><StatusBadge status={order.status} /></td>
            <td className="px-3 py-3 text-sm">{order.responsibleName}</td>
            <td className="px-4 py-3 text-right"><Link aria-label={`Abrir ${formatOrderNumber(order.number)}`} className="inline-flex min-h-9 items-center gap-1 rounded-md border px-3 text-xs font-semibold text-[var(--brand)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href={`/ordens-servico/${order.id}`}>Abrir <ArrowRight aria-hidden="true" className="size-3.5" /></Link></td>
          </tr>
        ))}</tbody></table></div>
      )}
    </section>
  );
}

function DailyStats({ daily }: { daily: DashboardData["daily"] }) {
  const items = [
    { label: "OS abertas hoje", value: String(daily.opened), icon: ClipboardPlus },
    { label: "OS entregues hoje", value: String(daily.delivered), icon: ClipboardCheck },
    { label: "Faturamento de hoje", value: formatOrderMoney(daily.revenue), icon: Banknote },
    { label: "Ticket médio de hoje", value: formatOrderMoney(daily.averageTicket), icon: CircleDollarSign },
  ];
  return <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{items.map((item) => { const Icon = item.icon; return <div className="flex items-center gap-3 rounded-xl border bg-white p-3 shadow-[0_2px_8px_rgba(16,45,63,0.035)]" key={item.label}><span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-teal-50 text-[var(--action)]"><Icon className="size-4" /></span><div><dt className="text-xs font-semibold text-[var(--ink-muted)]">{item.label}</dt><dd className="mt-0.5 font-display text-xl font-bold tabular-nums text-[var(--brand)]">{item.value}</dd></div></div>; })}</dl>;
}

const actionIcons: Record<DashboardNextAction["kind"], typeof Wrench> = {
  approval: CheckCircle2,
  diagnosis: Stethoscope,
  execution: Wrench,
  delivery: CarFront,
  overdue: TriangleAlert,
};

function OperationalPanels({ data }: { data: DashboardData }) {
  return (
    <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-1">
      <section className="overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]"><div className="flex items-center gap-3 border-b border-red-100 bg-red-50/70 px-4 py-3"><TriangleAlert aria-hidden="true" className="size-5 text-[var(--danger)]" /><div className="flex-1"><h2 className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--danger)]">Ação necessária</h2><p className="text-xs text-[var(--ink)]">Pendências calculadas pelas ordens atuais</p></div><span className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-[var(--danger)]">{data.attentionTotal} {data.attentionTotal === 1 ? "item" : "itens"}</span></div>{data.attentionItems.length === 0 ? <p className="px-4 py-8 text-center text-sm text-[var(--ink-muted)]">Nenhuma pendência urgente no momento.</p> : <ol className="divide-y px-4">{data.attentionItems.map((item) => <li className="py-3" key={item.id}><p className="text-sm font-semibold text-[var(--brand)]">{item.title}</p><p className="mt-0.5 text-xs text-[var(--ink-muted)]">{item.detail}</p><Link className="mt-1.5 inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-[var(--action)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href={item.href}>{item.action} <ArrowRight aria-hidden="true" className="size-3" /></Link></li>)}</ol>}</section>
      <section className="rounded-xl border bg-white p-4 shadow-[0_2px_8px_rgba(16,45,63,0.04)]"><h2 className="font-display text-lg font-bold text-[var(--brand)]">Próximas ações</h2>{data.nextActions.length === 0 ? <p className="py-8 text-center text-sm text-[var(--ink-muted)]">Nenhuma ação operacional pendente.</p> : <ul className="mt-2 space-y-2">{data.nextActions.map((item) => { const Icon = actionIcons[item.kind]; return <li key={item.id}><Link className="flex min-h-12 items-center gap-3 rounded-lg border px-3 hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href={item.href}><Icon aria-hidden="true" className={cn("size-4 shrink-0", item.kind === "overdue" ? "text-[var(--danger)]" : "text-[var(--action)]")} /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[var(--brand)]">{item.title}</span><span className="block truncate text-xs text-[var(--ink-muted)]">{item.detail}</span></span><ArrowRight aria-hidden="true" className="size-4 text-[var(--ink-faint)]" /></Link></li>; })}</ul>}</section>
    </div>
  );
}

export function DashboardOverview({ data }: { data: DashboardData }) {
  const metrics = [
    { label: "Em diagnóstico", value: data.statusCounts.diagnosis, helper: "veículos em análise", icon: Search, tone: "blue", href: "/ordens-servico?situacao=em_diagnostico" },
    { label: "Aguardando aprovação", value: data.statusCounts.awaitingApproval, helper: "orçamentos pendentes", icon: Clock3, tone: "amber", href: "/ordens-servico?situacao=aguardando_aprovacao" },
    { label: "Em execução", value: data.statusCounts.execution, helper: "serviços em andamento", icon: Wrench, tone: "teal", href: "/ordens-servico?situacao=em_execucao" },
    { label: "Prontas para retirada", value: data.statusCounts.readyForPickup, helper: "aguardando o cliente", icon: CheckCircle2, tone: "green", href: "/ordens-servico?situacao=pronta_retirada" },
    { label: "Atrasadas", value: data.statusCounts.overdue, helper: "com prazo excedido", icon: TriangleAlert, tone: "red", href: "/ordens-servico" },
  ] as const;
  return <div className="space-y-3"><section aria-label="Situação atual da oficina" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</section><div className="grid gap-3 2xl:grid-cols-[minmax(0,1.8fr)_minmax(22rem,0.75fr)]"><RecentOrders orders={data.recentOrders} /><OperationalPanels data={data} /></div><DailyStats daily={data.daily} /></div>;
}
