"use client";

import {
  Check,
  CheckCircle2,
  LoaderCircle,
  PackageCheck,
  Play,
  RotateCcw,
} from "lucide-react";
import { useActionState, useMemo } from "react";

import { FormMessage } from "@/components/shared/form-message";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { setOrderItemExecutedAction } from "../actions/execution";
import {
  markReadyForPickupAction,
  startExecutionAction,
} from "../actions/workflow";
import { formatOrderMoney } from "../formatters";
import {
  INITIAL_ORDER_ACTION_STATE,
  type OrderStatus,
  type ServiceOrderItem,
} from "../types";

function StartExecution({
  itemCount,
  orderId,
  version,
}: {
  itemCount: number;
  orderId: string;
  version: number;
}) {
  const action = useMemo(
    () => startExecutionAction.bind(null, orderId, version),
    [orderId, version],
  );
  const [state, dispatch, pending] = useActionState(
    action,
    INITIAL_ORDER_ACTION_STATE,
  );

  return (
    <div className="rounded-lg border border-teal-200 bg-teal-50/60 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-[var(--brand)]">
            {itemCount} {itemCount === 1 ? "item autorizado" : "itens autorizados"} para executar.
          </p>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Inicie esta etapa para registrar o andamento de cada item.
          </p>
        </div>
        <form
          action={dispatch}
          onSubmit={(event) => {
            if (!window.confirm("Deseja iniciar a execução desta ordem?")) {
              event.preventDefault();
            }
          }}
        >
          <Button className="w-full sm:w-auto" disabled={pending || itemCount === 0} type="submit">
            {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Play aria-hidden="true" className="size-4" />}
            {pending ? "Iniciando..." : "Iniciar execução"}
          </Button>
        </form>
      </div>
      <FormMessage message={state.message} tone="error" />
    </div>
  );
}

function ExecutionItem({
  item,
  orderId,
  version,
}: {
  item: ServiceOrderItem;
  orderId: string;
  version: number;
}) {
  const executed = Boolean(item.executedAt);
  const action = useMemo(
    () => setOrderItemExecutedAction.bind(null, orderId, item.id, version, !executed),
    [executed, item.id, orderId, version],
  );
  const [state, dispatch, pending] = useActionState(action, INITIAL_ORDER_ACTION_STATE);

  return (
    <li className={cn("rounded-lg border p-3.5", executed && "border-green-200 bg-green-50/50")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span aria-hidden="true" className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border", executed ? "border-green-200 bg-green-100 text-[var(--success)]" : "border-[var(--border)] bg-white text-[var(--ink-faint)]")}>
            {executed && <Check className="size-4" />}
          </span>
          <div className="min-w-0">
            <p className={cn("font-semibold text-[var(--ink)]", executed && "line-through decoration-green-700/40")}>{item.description}</p>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">
              {item.type === "servico" ? "Serviço" : "Material"} · {formatOrderMoney(item.subtotal)}
              {executed && item.executedByName ? ` · concluído por ${item.executedByName}` : ""}
            </p>
          </div>
        </div>
        <form
          action={dispatch}
          onSubmit={(event) => {
            if (executed && !window.confirm(`Desfazer a conclusão de ${item.description}?`)) {
              event.preventDefault();
            }
          }}
        >
          <Button className="w-full sm:w-auto" disabled={pending} type="submit" variant={executed ? "secondary" : "primary"}>
            {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : executed ? <RotateCcw aria-hidden="true" className="size-4" /> : <CheckCircle2 aria-hidden="true" className="size-4" />}
            <span className="sr-only">{executed ? `Desfazer conclusão de ${item.description}` : `Concluir ${item.description}`}</span>
            <span aria-hidden="true">{pending ? "Salvando..." : executed ? "Desfazer" : "Concluir item"}</span>
          </Button>
        </form>
      </div>
      <FormMessage message={state.message} tone="error" />
    </li>
  );
}

function ReadyForPickup({
  disabled,
  orderId,
  version,
}: {
  disabled: boolean;
  orderId: string;
  version: number;
}) {
  const action = useMemo(
    () => markReadyForPickupAction.bind(null, orderId, version),
    [orderId, version],
  );
  const [state, dispatch, pending] = useActionState(action, INITIAL_ORDER_ACTION_STATE);

  return (
    <div className="mt-4 border-t pt-4">
      <FormMessage message={state.message} tone="error" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--ink-muted)]">
          {disabled
            ? "Conclua todos os itens para liberar o veículo."
            : "Execução concluída. O veículo pode ser liberado."}
        </p>
        <form
          action={dispatch}
          onSubmit={(event) => {
            if (!window.confirm("Confirmar que o veículo está pronto para retirada?")) {
              event.preventDefault();
            }
          }}
        >
          <Button className="w-full sm:w-auto" disabled={disabled || pending} type="submit">
            {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <PackageCheck aria-hidden="true" className="size-4" />}
            {pending ? "Liberando..." : "Liberar para retirada"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export function ExecutionPanel({
  items,
  orderId,
  status,
  version,
}: {
  items: ServiceOrderItem[];
  orderId: string;
  status: OrderStatus;
  version: number;
}) {
  const approvedItems = items.filter(
    (item) => !item.removedAt && item.approvalStatus === "aprovado",
  );
  const completedCount = approvedItems.filter((item) => item.executedAt).length;

  if (approvedItems.length === 0) {
    return (
      <p className="rounded-lg border border-dashed bg-[var(--surface-subtle)] px-4 py-6 text-center text-sm font-semibold text-[var(--brand)]">
        Nenhum item autorizado para execução.
      </p>
    );
  }

  if (status === "aprovada") {
    return <StartExecution itemCount={approvedItems.length} orderId={orderId} version={version} />;
  }

  const completion = Math.round((completedCount / approvedItems.length) * 100);

  return (
    <div>
      <div className="rounded-lg bg-[var(--surface-subtle)] px-4 py-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="font-semibold text-[var(--brand)]">Progresso da execução</p>
          <p className="font-bold tabular-nums text-[var(--action)]">{completedCount} de {approvedItems.length} concluído{approvedItems.length === 1 ? "" : "s"}</p>
        </div>
        <div aria-label={`${completion}% da execução concluída`} aria-valuemax={100} aria-valuemin={0} aria-valuenow={completion} className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--border)]" role="progressbar">
          <div className="h-full rounded-full bg-[var(--action)] transition-[width]" style={{ width: `${completion}%` }} />
        </div>
      </div>

      <ul className="mt-3 space-y-2">
        {approvedItems.map((item) => (
          <ExecutionItem item={item} key={item.id} orderId={orderId} version={version} />
        ))}
      </ul>

      <ReadyForPickup
        disabled={completedCount !== approvedItems.length}
        orderId={orderId}
        version={version}
      />
    </div>
  );
}
