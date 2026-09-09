"use client";

import { ArrowDown, LoaderCircle, Play } from "lucide-react";
import { useActionState, useMemo } from "react";

import { FormMessage } from "@/components/shared/form-message";
import { startDiagnosisAction } from "../actions/workflow";
import {
  INITIAL_ORDER_ACTION_STATE,
  type OrderStatus,
} from "../types";

export function OrderStatusAction({
  orderId,
  status,
  version,
}: {
  orderId: string;
  status: OrderStatus;
  version: number;
}) {
  const action = useMemo(
    () => startDiagnosisAction.bind(null, orderId, version),
    [orderId, version],
  );
  const [state, dispatch, pending] = useActionState(
    action,
    INITIAL_ORDER_ACTION_STATE,
  );

  if (status === "em_diagnostico") {
    return (
      <a
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--action)] px-4 text-sm font-semibold text-white hover:bg-[var(--action-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2"
        href="#diagnostico-form"
      >
        <ArrowDown aria-hidden="true" className="size-4" />
        Ir para o diagnóstico
      </a>
    );
  }

  if (status !== "aberta") return null;

  return (
    <div className="mt-3">
      <FormMessage message={state.message} tone="error" />
      <form
        action={dispatch}
        className={state.message ? "mt-2" : undefined}
        onSubmit={(event) => {
          if (!window.confirm("Deseja iniciar o diagnóstico desta ordem?")) {
            event.preventDefault();
          }
        }}
      >
        <button
          className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--action)] px-4 text-sm font-semibold text-white hover:bg-[var(--action-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          disabled={pending}
          type="submit"
        >
          {pending ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Play aria-hidden="true" className="size-4" />
          )}
          {pending ? "Iniciando diagnóstico..." : "Iniciar diagnóstico"}
        </button>
      </form>
    </div>
  );
}
