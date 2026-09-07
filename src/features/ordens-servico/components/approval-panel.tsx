"use client";

import {
  CheckCheck,
  ClipboardCheck,
  LoaderCircle,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import { FormMessage } from "@/components/shared/form-message";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { registerOrderApprovalsAction } from "../actions/approvals";
import {
  formatApprovalStatus,
  formatOrderDateTimeInput,
  formatOrderMoney,
} from "../formatters";
import {
  INITIAL_ORDER_ACTION_STATE,
  type ApprovalStatus,
  type ServiceOrderItem,
} from "../types";

type Decision = "" | "aprovado" | "recusado";

const inputClassName =
  "mt-1.5 min-h-11 w-full rounded-lg border bg-white px-3.5 text-base text-[var(--ink)] outline-none focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/20";

const statusClasses: Record<ApprovalStatus, string> = {
  pendente: "bg-amber-50 text-[var(--warning)] ring-amber-700/15",
  aprovado: "bg-green-50 text-[var(--success)] ring-green-700/15",
  recusado: "bg-red-50 text-[var(--danger)] ring-red-700/15",
};

export function ApprovalPanel({
  items,
  orderId,
  respondedAtDefault,
  version,
}: {
  items: ServiceOrderItem[];
  orderId: string;
  respondedAtDefault: string;
  version: number;
}) {
  const activeItems = items.filter((item) => !item.removedAt);
  const action = useMemo(
    () => registerOrderApprovalsAction.bind(null, orderId),
    [orderId],
  );
  const [state, dispatch, pending] = useActionState(action, INITIAL_ORDER_ACTION_STATE);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [localError, setLocalError] = useState<string>();
  const selectedDecisions = Object.entries(decisions)
    .filter((entry): entry is [string, Exclude<Decision, "">] => Boolean(entry[1]))
    .map(([itemId, decision]) => ({ itemId, decision }));
  const approvedCount = selectedDecisions.filter((item) => item.decision === "aprovado").length;
  const rejectedCount = selectedDecisions.length - approvedCount;

  function setAll(decision: Exclude<Decision, "">) {
    setDecisions(Object.fromEntries(activeItems.map((item) => [item.id, decision])));
    setLocalError(undefined);
  }

  return (
    <section className="overflow-hidden rounded-lg border border-teal-200 bg-white shadow-[0_6px_20px_rgba(16,45,63,0.06)]">
      <div className="flex flex-col gap-3 border-b bg-teal-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-[var(--action)] shadow-sm">
            <ClipboardCheck className="size-4.5" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-[var(--brand)]">Registrar resposta do cliente</h3>
            <p className="text-xs text-[var(--ink-muted)]">Selecione somente os itens cuja resposta deseja registrar agora.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setAll("aprovado")} size="compact" type="button" variant="secondary">
            <ThumbsUp aria-hidden="true" className="size-4" /> Aprovar todos
          </Button>
          <Button onClick={() => setAll("recusado")} size="compact" type="button" variant="secondary">
            <ThumbsDown aria-hidden="true" className="size-4" /> Recusar todos
          </Button>
        </div>
      </div>

      <form
        action={dispatch}
        className="p-4"
        onSubmit={(event) => {
          if (selectedDecisions.length === 0) {
            event.preventDefault();
            setLocalError("Escolha ao menos uma decisão antes de registrar.");
            return;
          }
          if (!window.confirm(`Registrar ${selectedDecisions.length} ${selectedDecisions.length === 1 ? "decisão" : "decisões"} do cliente?`)) {
            event.preventDefault();
          }
        }}
      >
        <input name="decisions" type="hidden" value={JSON.stringify(selectedDecisions)} />
        <input name="expectedVersion" type="hidden" value={version} />
        {localError && <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950" role="alert">{localError}</p>}
        <FormMessage message={state.message} tone="error" />

        <ul className="mt-3 space-y-2">
          {activeItems.map((item) => (
            <li className="grid gap-3 rounded-lg border px-3.5 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,0.42fr)] sm:items-center" key={item.id}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-[var(--ink)]">{item.description}</p>
                  <span className={cn("rounded-full px-2 py-0.5 text-2xs font-bold ring-1 ring-inset", statusClasses[item.approvalStatus])}>
                    Atual: {formatApprovalStatus(item.approvalStatus)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">{formatOrderMoney(item.subtotal)}</p>
              </div>
              <label className="text-sm font-semibold" htmlFor={`approval-${item.id}`}>
                <span className="sr-only">Decisão para </span>{item.description}
                <select
                  aria-label={`Decisão para ${item.description}`}
                  className={inputClassName}
                  disabled={pending}
                  id={`approval-${item.id}`}
                  onChange={(event) => {
                    setDecisions((current) => ({ ...current, [item.id]: event.target.value as Decision }));
                    setLocalError(undefined);
                  }}
                  value={decisions[item.id] ?? ""}
                >
                  <option value="">Não registrar agora</option>
                  <option value="aprovado">Aprovar</option>
                  <option value="recusado">Recusar</option>
                </select>
              </label>
            </li>
          ))}
        </ul>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="text-sm font-semibold" htmlFor="approval-channel">
            Canal da resposta
            <select className={inputClassName} defaultValue="whatsapp" disabled={pending} id="approval-channel" name="channel" required>
              <option value="whatsapp">WhatsApp</option>
              <option value="telefone">Telefone</option>
              <option value="presencial">Presencial</option>
            </select>
          </label>
          <label className="text-sm font-semibold" htmlFor="approval-responded-at">
            Data e hora da resposta
            <input className={inputClassName} defaultValue={formatOrderDateTimeInput(respondedAtDefault)} disabled={pending} id="approval-responded-at" name="respondedAt" required type="datetime-local" />
          </label>
          <label className="text-sm font-semibold lg:col-span-2" htmlFor="approval-notes">
            Observações
            <textarea className={`${inputClassName} min-h-20 resize-y py-3`} disabled={pending} id="approval-notes" maxLength={1000} name="notes" placeholder="Ex.: cliente confirmou os itens por mensagem" />
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite" className="text-sm text-[var(--ink-muted)]">
            {selectedDecisions.length === 0
              ? "Nenhuma nova decisão selecionada."
              : `${approvedCount} aprovado${approvedCount === 1 ? "" : "s"} e ${rejectedCount} recusado${rejectedCount === 1 ? "" : "s"}.`}
          </p>
          <Button disabled={pending || activeItems.length === 0} type="submit">
            {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <CheckCheck aria-hidden="true" className="size-4" />}
            {pending ? "Registrando..." : "Registrar decisões"}
          </Button>
        </div>
      </form>
    </section>
  );
}
