"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  CarFront,
  ClipboardPlus,
  FileWarning,
  Gauge,
  LoaderCircle,
  Save,
} from "lucide-react";
import Link from "next/link";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormMessage } from "@/components/shared/form-message";
import { Button } from "@/components/ui/button";
import { formatCpf } from "@/features/clientes/formatters";
import {
  createServiceOrderAction,
  listVehiclesForOrderAction,
} from "../actions/intake";
import { FUEL_LEVEL_VALUES, intakeSchema, type IntakeData } from "../schemas";
import {
  INITIAL_ORDER_ACTION_STATE,
  type IntakeFormValues,
  type OrderClientOption,
  type OrderResponsibleOption,
  type OrderVehicleOption,
} from "../types";

const inputClassName =
  "mt-1.5 min-h-11 w-full rounded-lg border bg-white px-3.5 text-base text-[var(--ink)] outline-none placeholder:text-slate-400 focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/20 aria-[invalid=true]:border-[var(--danger)] aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-600";

const fuelLabels: Record<(typeof FUEL_LEVEL_VALUES)[number], string> = {
  reserva: "Reserva",
  um_quarto: "1/4",
  metade: "1/2",
  tres_quartos: "3/4",
  cheio: "Cheio",
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

export function IntakeForm({
  clients,
  currentUserId,
  defaultEntryAt,
  initialClientId = "",
  initialVehicles = [],
  responsibles,
}: {
  clients: OrderClientOption[];
  currentUserId: string;
  defaultEntryAt: string;
  initialClientId?: string;
  initialVehicles?: OrderVehicleOption[];
  responsibles: OrderResponsibleOption[];
}) {
  const [state, dispatch, pending] = useActionState(
    createServiceOrderAction,
    INITIAL_ORDER_ACTION_STATE,
  );
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [vehicleMessage, setVehicleMessage] = useState<string>();
  const requestId = useRef(0);
  const defaultResponsible = responsibles.some(
    (responsible) => responsible.id === currentUserId,
  )
    ? currentUserId
    : (responsibles[0]?.id ?? "");
  const form = useForm<IntakeFormValues, unknown, IntakeData>({
    resolver: zodResolver(intakeSchema),
    defaultValues: {
      clientId: initialClientId,
      vehicleId: "",
      responsibleId: defaultResponsible,
      entryAt: defaultEntryAt,
      mileage: "",
      fuelLevel: "metade",
      customerComplaint: "",
      expectedCompletionAt: "",
      accessories: "",
      visibleDamage: "",
      notes: "",
    },
    shouldFocusError: true,
  });
  const selectedClientId = useWatch({
    control: form.control,
    name: "clientId",
  });

  useEffect(() => {
    const firstField = Object.keys(state.fieldErrors ?? {})[0];
    if (firstField) form.setFocus(firstField as keyof IntakeFormValues);
  }, [form, state.fieldErrors]);

  async function loadVehicles(clientId: string) {
    const currentRequest = ++requestId.current;
    form.setValue("vehicleId", "");
    setVehicles([]);
    setVehicleMessage(undefined);
    if (!clientId) {
      setLoadingVehicles(false);
      return;
    }

    setLoadingVehicles(true);
    try {
      const nextVehicles = await listVehiclesForOrderAction(clientId);
      if (currentRequest !== requestId.current) return;
      setVehicles(nextVehicles);
      if (nextVehicles.length === 0) {
        setVehicleMessage("Este cliente não possui veículo ativo cadastrado.");
      }
    } catch {
      if (currentRequest !== requestId.current) return;
      setVehicleMessage("Não foi possível carregar os veículos deste cliente.");
    } finally {
      if (currentRequest === requestId.current) setLoadingVehicles(false);
    }
  }

  const submit = form.handleSubmit((values) => {
    const data = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      data.set(key, String(value ?? ""));
    });
    startTransition(() => dispatch(data));
  });

  const errorFor = (field: keyof IntakeFormValues) =>
    form.formState.errors[field]?.message?.toString() ??
    state.fieldErrors?.[field]?.[0];
  const describedBy = (field: keyof IntakeFormValues) =>
    errorFor(field) ? `${field}-error` : undefined;
  const clientRegister = form.register("clientId");

  return (
    <form className="space-y-3" noValidate onSubmit={submit}>
      <FormMessage message={state.message} tone="error" />

      <section className="overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
        <SectionTitle
          description="Defina os vínculos operacionais deste atendimento"
          icon={ClipboardPlus}
          title="Atendimento"
        />
        <div className="grid gap-4 p-4 md:grid-cols-3 sm:p-5">
          <label className="text-sm font-semibold" htmlFor="clientId">
            Cliente <span className="text-[var(--danger)]">*</span>
            <select
              {...clientRegister}
              aria-describedby={describedBy("clientId")}
              aria-invalid={Boolean(errorFor("clientId"))}
              className={inputClassName}
              id="clientId"
              onChange={(event) => {
                clientRegister.onChange(event);
                void loadVehicles(event.target.value);
              }}
            >
              <option value="">Selecione um cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} — CPF {formatCpf(client.cpf)}
                </option>
              ))}
            </select>
            <ErrorText id="clientId-error" message={errorFor("clientId")} />
          </label>

          <label className="text-sm font-semibold" htmlFor="vehicleId">
            Veículo <span className="text-[var(--danger)]">*</span>
            <select
              {...form.register("vehicleId")}
              aria-describedby={describedBy("vehicleId")}
              aria-invalid={Boolean(errorFor("vehicleId"))}
              className={inputClassName}
              disabled={!selectedClientId || loadingVehicles}
              id="vehicleId"
            >
              <option value="">
                {loadingVehicles ? "Carregando veículos..." : "Selecione um veículo"}
              </option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plate} — {vehicle.label}
                </option>
              ))}
            </select>
            <ErrorText id="vehicleId-error" message={errorFor("vehicleId")} />
            {vehicleMessage && (
              <p className="mt-1 text-sm text-[var(--warning)]" role="status">
                {vehicleMessage}
              </p>
            )}
          </label>

          <label className="text-sm font-semibold" htmlFor="responsibleId">
            Responsável <span className="text-[var(--danger)]">*</span>
            <select
              {...form.register("responsibleId")}
              aria-describedby={describedBy("responsibleId")}
              aria-invalid={Boolean(errorFor("responsibleId"))}
              className={inputClassName}
              id="responsibleId"
            >
              <option value="">Selecione um responsável</option>
              {responsibles.map((responsible) => (
                <option key={responsible.id} value={responsible.id}>
                  {responsible.name}
                </option>
              ))}
            </select>
            <ErrorText
              id="responsibleId-error"
              message={errorFor("responsibleId")}
            />
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
        <SectionTitle
          description="Registre a condição e a necessidade informada pelo cliente"
          icon={Gauge}
          title="Entrada do veículo"
        />
        <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-4 sm:p-5">
          <label className="text-sm font-semibold" htmlFor="entryAt">
            Data e hora de entrada <span className="text-[var(--danger)]">*</span>
            <input
              {...form.register("entryAt")}
              aria-describedby={describedBy("entryAt")}
              aria-invalid={Boolean(errorFor("entryAt"))}
              className={inputClassName}
              id="entryAt"
              type="datetime-local"
            />
            <ErrorText id="entryAt-error" message={errorFor("entryAt")} />
          </label>
          <label className="text-sm font-semibold" htmlFor="mileage">
            Quilometragem <span className="text-[var(--danger)]">*</span>
            <input
              {...form.register("mileage")}
              aria-describedby={describedBy("mileage")}
              aria-invalid={Boolean(errorFor("mileage"))}
              className={inputClassName}
              id="mileage"
              inputMode="numeric"
              maxLength={7}
              placeholder="Ex.: 84520"
            />
            <ErrorText id="mileage-error" message={errorFor("mileage")} />
          </label>
          <label className="text-sm font-semibold" htmlFor="fuelLevel">
            Nível de combustível <span className="text-[var(--danger)]">*</span>
            <select
              {...form.register("fuelLevel")}
              aria-describedby={describedBy("fuelLevel")}
              aria-invalid={Boolean(errorFor("fuelLevel"))}
              className={inputClassName}
              id="fuelLevel"
            >
              {FUEL_LEVEL_VALUES.map((level) => (
                <option key={level} value={level}>
                  {fuelLabels[level]}
                </option>
              ))}
            </select>
            <ErrorText id="fuelLevel-error" message={errorFor("fuelLevel")} />
          </label>
          <label className="text-sm font-semibold" htmlFor="expectedCompletionAt">
            Previsão de conclusão
            <input
              {...form.register("expectedCompletionAt")}
              aria-describedby={describedBy("expectedCompletionAt")}
              aria-invalid={Boolean(errorFor("expectedCompletionAt"))}
              className={inputClassName}
              id="expectedCompletionAt"
              type="datetime-local"
            />
            <ErrorText
              id="expectedCompletionAt-error"
              message={errorFor("expectedCompletionAt")}
            />
          </label>
          <label className="text-sm font-semibold md:col-span-2 lg:col-span-4" htmlFor="customerComplaint">
            Relato do cliente <span className="text-[var(--danger)]">*</span>
            <textarea
              {...form.register("customerComplaint")}
              aria-describedby={describedBy("customerComplaint")}
              aria-invalid={Boolean(errorFor("customerComplaint"))}
              className={`${inputClassName} min-h-28 resize-y py-3`}
              id="customerComplaint"
              maxLength={2000}
              placeholder="Descreva o problema relatado e quando ele ocorre"
            />
            <ErrorText
              id="customerComplaint-error"
              message={errorFor("customerComplaint")}
            />
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
        <SectionTitle
          description="Faça uma conferência visual antes de receber o veículo"
          icon={FileWarning}
          title="Condições de entrada"
        />
        <div className="grid gap-4 p-4 lg:grid-cols-3 sm:p-5">
          <label className="text-sm font-semibold" htmlFor="accessories">
            Acessórios deixados
            <textarea
              {...form.register("accessories")}
              className={`${inputClassName} min-h-24 resize-y py-3`}
              id="accessories"
              maxLength={1000}
              placeholder="Ex.: controle do alarme, cabo USB"
            />
            <ErrorText id="accessories-error" message={errorFor("accessories")} />
          </label>
          <label className="text-sm font-semibold" htmlFor="visibleDamage">
            Avarias visíveis
            <textarea
              {...form.register("visibleDamage")}
              className={`${inputClassName} min-h-24 resize-y py-3`}
              id="visibleDamage"
              maxLength={1000}
              placeholder="Ex.: risco no para-choque dianteiro"
            />
            <ErrorText
              id="visibleDamage-error"
              message={errorFor("visibleDamage")}
            />
          </label>
          <label className="text-sm font-semibold" htmlFor="notes">
            Observações internas
            <textarea
              {...form.register("notes")}
              className={`${inputClassName} min-h-24 resize-y py-3`}
              id="notes"
              maxLength={1000}
              placeholder="Informações úteis para o atendimento"
            />
            <ErrorText id="notes-error" message={errorFor("notes")} />
          </label>
        </div>
      </section>

      <div className="sticky bottom-0 z-10 flex flex-col-reverse gap-2 border-t bg-[var(--canvas)]/95 py-3 backdrop-blur sm:flex-row sm:justify-end">
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
          href="/ordens-servico"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Cancelar
        </Link>
        <Button
          disabled={pending || clients.length === 0 || responsibles.length === 0}
          type="submit"
        >
          {pending ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Save aria-hidden="true" className="size-4" />
          )}
          {pending ? "Abrindo ordem..." : "Abrir ordem de serviço"}
        </Button>
      </div>
    </form>
  );
}
