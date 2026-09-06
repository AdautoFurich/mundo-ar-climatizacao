"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightLeft, LoaderCircle } from "lucide-react";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormMessage } from "@/components/shared/form-message";
import { formatCpf } from "@/features/clientes/formatters";
import { transferVehicleAction } from "../actions";
import { transferVehicleSchema } from "../schemas";
import {
  INITIAL_VEHICLE_ACTION_STATE,
  type ActiveClientOption,
} from "../types";

type TransferInput = z.input<typeof transferVehicleSchema>;

export function VehicleTransferForm({
  clients,
  currentOwnerId,
  vehicleId,
}: {
  clients: ActiveClientOption[];
  currentOwnerId: string;
  vehicleId: string;
}) {
  const destinations = clients.filter((client) => client.id !== currentOwnerId);
  const [state, dispatch, pending] = useActionState(
    transferVehicleAction,
    INITIAL_VEHICLE_ACTION_STATE,
  );
  const form = useForm<TransferInput>({
    resolver: zodResolver(transferVehicleSchema),
    defaultValues: { vehicleId, newOwnerId: "" },
    shouldFocusError: true,
  });

  useEffect(() => {
    if (state.fieldErrors?.newOwnerId) form.setFocus("newOwnerId");
  }, [form, state.fieldErrors]);

  const submit = form.handleSubmit((values) => {
    if (!window.confirm("Confirma a transferência para o cliente selecionado?")) {
      return;
    }
    const data = new FormData();
    data.set("vehicleId", values.vehicleId);
    data.set("newOwnerId", values.newOwnerId);
    startTransition(() => dispatch(data));
  });
  const error =
    form.formState.errors.newOwnerId?.message?.toString() ??
    state.fieldErrors?.newOwnerId?.[0];

  return (
    <form className="space-y-3" noValidate onSubmit={submit}>
      <FormMessage message={state.message} tone="error" />
      <input {...form.register("vehicleId")} type="hidden" />
      <label className="block text-sm font-semibold" htmlFor="newOwnerId">
        Novo proprietário <span className="text-[var(--danger)]">*</span>
        <select
          {...form.register("newOwnerId")}
          aria-describedby={error ? "newOwnerId-error" : undefined}
          aria-invalid={Boolean(error)}
          className="mt-1.5 min-h-11 w-full rounded-lg border bg-white px-3.5 text-base outline-none focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/20 aria-[invalid=true]:border-[var(--danger)]"
          id="newOwnerId"
        >
          <option value="">Selecione outro cliente</option>
          {destinations.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name} — CPF {formatCpf(client.cpf)}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm text-[var(--danger)]" id="newOwnerId-error" role="alert">
            {error}
          </p>
        )}
      </label>
      <button
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--action)] px-4 text-sm font-semibold text-white hover:bg-[var(--action-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={pending || destinations.length === 0}
        type="submit"
      >
        {pending ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <ArrowRightLeft aria-hidden="true" className="size-4" />
        )}
        {pending ? "Transferindo..." : "Transferir veículo"}
      </button>
      {destinations.length === 0 && (
        <p className="text-xs text-[var(--ink-muted)]">
          Cadastre outro cliente ativo para realizar uma transferência.
        </p>
      )}
    </form>
  );
}

