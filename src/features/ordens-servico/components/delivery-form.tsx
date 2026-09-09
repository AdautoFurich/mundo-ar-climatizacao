"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, CircleDollarSign, KeyRound, LoaderCircle } from "lucide-react";
import { startTransition, useActionState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";

import { FormMessage } from "@/components/shared/form-message";
import { Button } from "@/components/ui/button";
import { deliverOrderAction } from "../actions/delivery";
import { formatOrderDateTimeInput, formatOrderMoney } from "../formatters";
import {
  deliverySchema,
  type DeliveryData,
  type DeliveryInput,
} from "../schemas";
import { INITIAL_ORDER_ACTION_STATE } from "../types";

const inputClassName =
  "mt-1.5 min-h-11 w-full rounded-lg border bg-white px-3.5 text-base text-[var(--ink)] outline-none focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/20 aria-[invalid=true]:border-[var(--danger)] aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-100";

function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-[var(--danger)]" id={id} role="alert">{message}</p>;
}

export function DeliveryForm({
  authorizedTotal,
  deliveredAtDefault,
  orderId,
  version,
}: {
  authorizedTotal: number;
  deliveredAtDefault: string;
  orderId: string;
  version: number;
}) {
  const action = useMemo(() => deliverOrderAction.bind(null, orderId), [orderId]);
  const [state, dispatch, pending] = useActionState(action, INITIAL_ORDER_ACTION_STATE);
  const form = useForm<DeliveryInput, unknown, DeliveryData>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      paymentMethod: "pix",
      deliveredAt: formatOrderDateTimeInput(deliveredAtDefault),
      notes: "",
      expectedVersion: version,
    },
    shouldFocusError: true,
  });

  useEffect(() => {
    const firstField = Object.keys(state.fieldErrors ?? {})[0];
    if (firstField) form.setFocus(firstField as keyof DeliveryInput);
  }, [form, state.fieldErrors]);

  const errorFor = (field: keyof DeliveryInput) =>
    form.formState.errors[field]?.message?.toString() ?? state.fieldErrors?.[field]?.[0];

  const submit = form.handleSubmit((values) => {
    if (!window.confirm("Confirmar o pagamento e a entrega do veículo? Esta ação finalizará a ordem.")) return;

    const data = new FormData();
    Object.entries(values).forEach(([key, value]) => data.set(key, String(value ?? "")));
    startTransition(() => dispatch(data));
  });

  return (
    <form className="rounded-lg border border-teal-200 bg-teal-50/40 p-4" noValidate onSubmit={submit}>
      <div className="flex flex-col gap-4 border-b border-teal-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-[var(--action)] shadow-sm">
            <KeyRound className="size-4.5" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-[var(--brand)]">Registrar pagamento e entrega</h3>
            <p className="text-xs text-[var(--ink-muted)]">Confira os dados antes de finalizar a ordem.</p>
          </div>
        </div>
        <div className="rounded-lg bg-white px-4 py-2.5 shadow-sm">
          <p className="text-2xs font-bold uppercase tracking-[0.06em] text-[var(--ink-faint)]">Total autorizado</p>
          <p className="mt-0.5 font-display text-xl font-bold tabular-nums text-[var(--brand)]">{formatOrderMoney(authorizedTotal)}</p>
        </div>
      </div>

      <div className="mt-4"><FormMessage message={state.message} tone="error" /></div>
      <input {...form.register("expectedVersion")} type="hidden" />

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold" htmlFor="paymentMethod">
          <span className="flex items-center gap-1.5"><CircleDollarSign aria-hidden="true" className="size-4 text-[var(--action)]" /> Forma de pagamento</span>
          <select
            {...form.register("paymentMethod")}
            aria-describedby={errorFor("paymentMethod") ? "paymentMethod-error" : undefined}
            aria-invalid={Boolean(errorFor("paymentMethod"))}
            className={inputClassName}
            id="paymentMethod"
          >
            <option value="pix">Pix</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="cartao_credito">Cartão de crédito</option>
            <option value="cartao_debito">Cartão de débito</option>
            <option value="transferencia">Transferência</option>
            <option value="outro">Outro</option>
          </select>
          <ErrorText id="paymentMethod-error" message={errorFor("paymentMethod")} />
        </label>

        <label className="text-sm font-semibold" htmlFor="deliveredAt">
          <span className="flex items-center gap-1.5"><CalendarClock aria-hidden="true" className="size-4 text-[var(--action)]" /> Data e hora da entrega</span>
          <input
            {...form.register("deliveredAt")}
            aria-describedby={errorFor("deliveredAt") ? "deliveredAt-error" : undefined}
            aria-invalid={Boolean(errorFor("deliveredAt"))}
            className={inputClassName}
            id="deliveredAt"
            type="datetime-local"
          />
          <ErrorText id="deliveredAt-error" message={errorFor("deliveredAt")} />
        </label>

        <label className="text-sm font-semibold md:col-span-2" htmlFor="deliveryNotes">
          Observações
          <textarea
            {...form.register("notes")}
            aria-describedby={errorFor("notes") ? "deliveryNotes-error" : undefined}
            aria-invalid={Boolean(errorFor("notes"))}
            className={`${inputClassName} min-h-24 resize-y py-3`}
            id="deliveryNotes"
            maxLength={2000}
            placeholder="Ex.: veículo entregue ao proprietário"
          />
          <ErrorText id="deliveryNotes-error" message={errorFor("notes")} />
        </label>
      </div>

      <div className="mt-4 flex justify-end border-t border-teal-100 pt-4">
        <Button disabled={pending} type="submit">
          {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <KeyRound aria-hidden="true" className="size-4" />}
          {pending ? "Finalizando atendimento..." : "Confirmar pagamento e entrega"}
        </Button>
      </div>
    </form>
  );
}
