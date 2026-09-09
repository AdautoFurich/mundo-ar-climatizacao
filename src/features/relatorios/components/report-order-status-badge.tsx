import { formatOrderStatus } from "@/features/ordens-servico/formatters";
import type { OrderStatus } from "@/features/ordens-servico/types";
import { cn } from "@/lib/utils";

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

export function ReportOrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset", statusClasses[status])}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {formatOrderStatus(status)}
    </span>
  );
}
