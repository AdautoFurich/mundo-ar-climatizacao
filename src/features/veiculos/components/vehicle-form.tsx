"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  CarFront,
  FileText,
  Gauge,
  LoaderCircle,
  Save,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormMessage } from "@/components/shared/form-message";
import { Button } from "@/components/ui/button";
import { formatCpf } from "@/features/clientes/formatters";
import { createVehicleAction, updateVehicleAction } from "../actions";
import { formatPlate } from "../formatters";
import { FUEL_VALUES, vehicleFormSchema } from "../schemas";
import {
  INITIAL_VEHICLE_ACTION_STATE,
  type ActiveClientOption,
  type VehicleFormValues,
} from "../types";

const inputClassName =
  "mt-1.5 min-h-11 w-full rounded-lg border bg-white px-3.5 text-base text-[var(--ink)] outline-none placeholder:text-slate-400 focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/20 aria-[invalid=true]:border-[var(--danger)] aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-600";

type ParsedVehicle = z.output<typeof vehicleFormSchema>;

const emptyValues: VehicleFormValues = {
  ownerId: "",
  plate: "",
  brand: "",
  model: "",
  manufactureYear: "",
  modelYear: "",
  color: "",
  fuel: "",
  notes: "",
};

const fuelLabels: Record<(typeof FUEL_VALUES)[number], string> = {
  gasolina: "Gasolina",
  etanol: "Etanol",
  flex: "Flex",
  diesel: "Diesel",
  eletrico: "Elétrico",
  hibrido: "Híbrido",
};

function SectionTitle({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CarFront;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b px-4 py-3.5 sm:px-5">
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-50 text-[var(--action)]"
      >
        <Icon className="size-4.5" />
      </span>
      <div>
        <h2 className="font-display text-lg font-bold text-[var(--brand)]">{title}</h2>
        <p className="text-xs text-[var(--ink-muted)]">{description}</p>
      </div>
    </div>
  );
}

function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-sm text-[var(--danger)]" id={id} role="alert">
      {message}
    </p>
  );
}

export function VehicleForm({
  clients,
  defaultValues = emptyValues,
  vehicleId,
}: {
  clients: ActiveClientOption[];
  defaultValues?: VehicleFormValues;
  vehicleId?: string;
}) {
  const serverAction = useMemo(
    () =>
      vehicleId
        ? updateVehicleAction.bind(null, vehicleId)
        : createVehicleAction,
    [vehicleId],
  );
  const [state, dispatch, pending] = useActionState(
    serverAction,
    INITIAL_VEHICLE_ACTION_STATE,
  );
  const form = useForm<VehicleFormValues, unknown, ParsedVehicle>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues,
    shouldFocusError: true,
  });

  useEffect(() => {
    const firstField = Object.keys(state.fieldErrors ?? {})[0];
    if (firstField) form.setFocus(firstField as keyof VehicleFormValues);
  }, [form, state.fieldErrors]);

  const submit = form.handleSubmit((values) => {
    const data = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      data.set(key, String(value ?? ""));
    });
    startTransition(() => dispatch(data));
  });

  const errorFor = (field: keyof VehicleFormValues) =>
    form.formState.errors[field]?.message?.toString() ??
    state.fieldErrors?.[field]?.[0];
  const describedBy = (field: keyof VehicleFormValues) =>
    errorFor(field) ? `${field}-error` : undefined;
  const plate = form.register("plate");

  return (
    <form className="space-y-3" noValidate onSubmit={submit}>
      <FormMessage message={state.message} tone="error" />

      <section className="overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
        <SectionTitle
          description={
            vehicleId
              ? "Use a ação de transferência para trocar o vínculo"
              : "Cliente responsável pelo veículo"
          }
          icon={UserRound}
          title="Proprietário"
        />
        <div className="p-4 sm:p-5">
          <label className="text-sm font-semibold" htmlFor="ownerId">
            {vehicleId ? "Proprietário atual" : "Cliente proprietário"}{" "}
            <span className="text-[var(--danger)]">*</span>
            <select
              {...form.register("ownerId")}
              aria-describedby={describedBy("ownerId")}
              aria-invalid={Boolean(errorFor("ownerId"))}
              className={inputClassName}
              disabled={Boolean(vehicleId)}
              id="ownerId"
            >
              <option value="">Selecione um cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} — CPF {formatCpf(client.cpf)}
                </option>
              ))}
            </select>
            <ErrorText id="ownerId-error" message={errorFor("ownerId")} />
          </label>
          {clients.length === 0 && !vehicleId && (
            <p className="mt-2 text-sm text-[var(--danger)]" role="alert">
              Cadastre ou reative um cliente antes de incluir um veículo.
            </p>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
        <SectionTitle
          description="Dados usados para localizar o veículo"
          icon={CarFront}
          title="Identificação"
        />
        <div className="grid gap-4 p-4 sm:grid-cols-[minmax(10rem,0.7fr)_minmax(0,1fr)_minmax(0,1.4fr)] sm:p-5">
          <label className="text-sm font-semibold" htmlFor="plate">
            Placa <span className="text-[var(--danger)]">*</span>
            <input
              {...plate}
              aria-describedby={describedBy("plate")}
              aria-invalid={Boolean(errorFor("plate"))}
              autoCapitalize="characters"
              className={`${inputClassName} font-semibold uppercase tracking-[0.08em]`}
              id="plate"
              maxLength={8}
              onChange={(event) => {
                event.target.value = formatPlate(event.target.value);
                plate.onChange(event);
              }}
              placeholder="ABC-1234"
            />
            <ErrorText id="plate-error" message={errorFor("plate")} />
          </label>
          <label className="text-sm font-semibold" htmlFor="brand">
            Marca <span className="text-[var(--danger)]">*</span>
            <input
              {...form.register("brand")}
              aria-describedby={describedBy("brand")}
              aria-invalid={Boolean(errorFor("brand"))}
              className={inputClassName}
              id="brand"
              placeholder="Ex.: Chevrolet"
            />
            <ErrorText id="brand-error" message={errorFor("brand")} />
          </label>
          <label className="text-sm font-semibold" htmlFor="model">
            Modelo <span className="text-[var(--danger)]">*</span>
            <input
              {...form.register("model")}
              aria-describedby={describedBy("model")}
              aria-invalid={Boolean(errorFor("model"))}
              className={inputClassName}
              id="model"
              placeholder="Ex.: Onix Plus"
            />
            <ErrorText id="model-error" message={errorFor("model")} />
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
        <SectionTitle
          description="Informações técnicas e visuais"
          icon={Gauge}
          title="Características"
        />
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
          <label className="text-sm font-semibold" htmlFor="manufactureYear">
            Ano de fabricação <span className="text-[var(--danger)]">*</span>
            <input
              {...form.register("manufactureYear")}
              aria-describedby={describedBy("manufactureYear")}
              aria-invalid={Boolean(errorFor("manufactureYear"))}
              className={inputClassName}
              id="manufactureYear"
              inputMode="numeric"
              maxLength={4}
              placeholder="2020"
            />
            <ErrorText
              id="manufactureYear-error"
              message={errorFor("manufactureYear")}
            />
          </label>
          <label className="text-sm font-semibold" htmlFor="modelYear">
            Ano do modelo <span className="text-[var(--danger)]">*</span>
            <input
              {...form.register("modelYear")}
              aria-describedby={describedBy("modelYear")}
              aria-invalid={Boolean(errorFor("modelYear"))}
              className={inputClassName}
              id="modelYear"
              inputMode="numeric"
              maxLength={4}
              placeholder="2021"
            />
            <ErrorText id="modelYear-error" message={errorFor("modelYear")} />
          </label>
          <label className="text-sm font-semibold" htmlFor="color">
            Cor
            <input
              {...form.register("color")}
              aria-describedby={describedBy("color")}
              aria-invalid={Boolean(errorFor("color"))}
              className={inputClassName}
              id="color"
              placeholder="Ex.: Branco"
            />
            <ErrorText id="color-error" message={errorFor("color")} />
          </label>
          <label className="text-sm font-semibold" htmlFor="fuel">
            Combustível
            <select
              {...form.register("fuel")}
              aria-describedby={describedBy("fuel")}
              aria-invalid={Boolean(errorFor("fuel"))}
              className={inputClassName}
              id="fuel"
            >
              <option value="">Não informado</option>
              {FUEL_VALUES.map((fuel) => (
                <option key={fuel} value={fuel}>
                  {fuelLabels[fuel]}
                </option>
              ))}
            </select>
            <ErrorText id="fuel-error" message={errorFor("fuel")} />
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
        <SectionTitle
          description="Informações úteis para atendimentos futuros"
          icon={FileText}
          title="Informações adicionais"
        />
        <div className="p-4 sm:p-5">
          <label className="text-sm font-semibold" htmlFor="notes">
            Observações
            <textarea
              {...form.register("notes")}
              aria-describedby={describedBy("notes")}
              aria-invalid={Boolean(errorFor("notes"))}
              className={`${inputClassName} min-h-28 resize-y py-3`}
              id="notes"
              maxLength={1000}
              placeholder="Características ou informações relevantes do veículo"
            />
            <ErrorText id="notes-error" message={errorFor("notes")} />
          </label>
        </div>
      </section>

      <div className="sticky bottom-0 z-10 flex flex-col-reverse gap-2 border-t bg-[var(--canvas)]/95 py-3 backdrop-blur sm:flex-row sm:justify-end">
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
          href={vehicleId ? `/veiculos/${vehicleId}` : "/veiculos"}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Cancelar
        </Link>
        <Button disabled={pending || (clients.length === 0 && !vehicleId)} type="submit">
          {pending ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Save aria-hidden="true" className="size-4" />
          )}
          {pending
            ? "Salvando..."
            : vehicleId
              ? "Salvar alterações"
              : "Cadastrar veículo"}
        </Button>
      </div>
    </form>
  );
}
