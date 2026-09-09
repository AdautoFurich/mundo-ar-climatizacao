import {
  AlertTriangle,
  CalendarClock,
  CarFront,
  Check,
  ClipboardList,
  UserRound,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  formatOrderDate,
  formatOrderMoney,
  formatOrderNumber,
  formatOrderStatus,
} from "../formatters";
import type { OrderStatus, ServiceOrderDetails } from "../types";

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

const nextAction: Record<OrderStatus, string> = {
  aberta: "Iniciar diagnóstico",
  em_diagnostico: "Registrar diagnóstico técnico",
  aguardando_aprovacao: "Registrar decisão do cliente",
  aprovada: "Iniciar execução dos serviços",
  em_execucao: "Atualizar execução dos serviços",
  pronta_retirada: "Registrar entrega do veículo",
  entregue: "Atendimento concluído",
  reprovada: "Orçamento não aprovado",
  cancelada: "Ordem encerrada por cancelamento",
};

const workflow = [
  { status: "aberta", label: "Entrada" },
  { status: "em_diagnostico", label: "Diagnóstico" },
  { status: "aguardando_aprovacao", label: "Aprovação" },
  { status: "em_execucao", label: "Execução" },
  { status: "pronta_retirada", label: "Retirada" },
  { status: "entregue", label: "Entrega" },
] as const;

function workflowIndex(status: OrderStatus) {
  if (status === "aprovada") return 3;
  if (status === "reprovada") return 2;
  if (status === "cancelada") return -1;
  return workflow.findIndex((step) => step.status === status);
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset", statusClasses[status])}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {formatOrderStatus(status)}
    </span>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof CarFront;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--action)]" />
      <div className="min-w-0">
        <dt className="text-2xs font-bold uppercase tracking-[0.06em] text-[var(--ink-faint)]">{label}</dt>
        <dd className="mt-0.5 truncate text-sm font-semibold text-[var(--ink)]">{children}</dd>
      </div>
    </div>
  );
}

export function OrderSummary({
  action,
  order,
}: {
  action?: React.ReactNode;
  order: ServiceOrderDetails;
}) {
  const currentStep = workflowIndex(order.status);
  return (
    <section className="mb-3 overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]" aria-labelledby="order-number">
      <div className="h-1.5 bg-[var(--action)]" />
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-teal-50 text-[var(--action)]">
              <ClipboardList className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-3xl font-bold tracking-tight text-[var(--brand)]" id="order-number">
                  {formatOrderNumber(order.number)}
                </h2>
                <StatusBadge status={order.status} />
                {order.overdue && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-[var(--danger)] ring-1 ring-inset ring-red-700/15">
                    <AlertTriangle aria-hidden="true" className="size-3.5" /> Atrasada
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                Aberta em {formatOrderDate(order.entryAt)} · atualização {formatOrderDate(order.updatedAt)}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-teal-100 bg-teal-50/70 px-4 py-3 xl:min-w-72">
            <p className="text-2xs font-bold uppercase tracking-[0.08em] text-[var(--action)]">Próxima etapa</p>
            <p className="mt-1 font-display text-lg font-bold text-[var(--brand)]">{nextAction[order.status]}</p>
            {action ?? (
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                Ação operacional disponível em uma próxima entrega.
              </p>
            )}
          </div>
        </div>

        <dl className="mt-5 grid gap-4 border-t pt-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryItem icon={UserRound} label="Cliente">
            <Link className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href={`/clientes/${order.clientId}`}>{order.clientName}</Link>
          </SummaryItem>
          <SummaryItem icon={CarFront} label="Veículo">
            <Link className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href={`/veiculos/${order.vehicleId}`}>{order.vehicleLabel}</Link>
          </SummaryItem>
          <SummaryItem icon={UserRound} label="Responsável">{order.responsibleName}</SummaryItem>
          <SummaryItem icon={CalendarClock} label="Previsão">
            {order.expectedCompletionAt ? formatOrderDate(order.expectedCompletionAt) : "Sem previsão"}
          </SummaryItem>
          <SummaryItem icon={WalletCards} label="Total autorizado">{formatOrderMoney(order.authorizedTotal)}</SummaryItem>
        </dl>

        <div className="mt-5 border-t pt-4">
          <p className="mb-3 text-2xs font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">Fluxo operacional</p>
          <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {workflow.map((step, index) => {
              const completed = currentStep > index && order.status !== "reprovada";
              const active = currentStep === index;
              return (
                <li
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-2 rounded-lg border px-3 text-xs font-semibold",
                    completed && "border-teal-200 bg-teal-50 text-[var(--action)]",
                    active && "border-[var(--action)] bg-[var(--action)] text-white",
                    !completed && !active && "bg-[var(--surface-subtle)] text-[var(--ink-muted)]",
                  )}
                  key={step.status}
                >
                  <span aria-hidden="true" className={cn("grid size-5 shrink-0 place-items-center rounded-full border text-2xs", completed && "border-[var(--action)]", active && "border-white/60")}>
                    {completed ? <Check className="size-3" /> : index + 1}
                  </span>
                  {step.label}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
