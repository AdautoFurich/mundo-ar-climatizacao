"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  BadgeDollarSign,
  FileText,
  LoaderCircle,
  Save,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormMessage } from "@/components/shared/form-message";
import { Button } from "@/components/ui/button";
import { createServiceAction, updateServiceAction } from "../actions";
import { SERVICE_CATEGORY_LABELS } from "../formatters";
import { SERVICE_CATEGORY_VALUES, serviceFormSchema } from "../schemas";
import {
  INITIAL_SERVICE_ACTION_STATE,
  type ServiceFormValues,
} from "../types";

const inputClassName =
  "mt-1.5 min-h-11 w-full rounded-lg border bg-white px-3.5 text-base text-[var(--ink)] outline-none placeholder:text-slate-400 focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/20 aria-[invalid=true]:border-[var(--danger)] aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-100";

type ParsedService = z.output<typeof serviceFormSchema>;

const emptyValues: ServiceFormValues = {
  name: "",
  category: "",
  description: "",
  basePrice: "",
};

function SectionTitle({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: typeof Wrench;
  title: string;
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
        <h2 className="font-display text-lg font-bold text-[var(--brand)]">
          {title}
        </h2>
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

export function ServiceForm({
  defaultValues = emptyValues,
  serviceId,
}: {
  defaultValues?: ServiceFormValues;
  serviceId?: string;
}) {
  const serverAction = useMemo(
    () =>
      serviceId
        ? updateServiceAction.bind(null, serviceId)
        : createServiceAction,
    [serviceId],
  );
  const [state, dispatch, pending] = useActionState(
    serverAction,
    INITIAL_SERVICE_ACTION_STATE,
  );
  const form = useForm<ServiceFormValues, unknown, ParsedService>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues,
    shouldFocusError: true,
  });

  useEffect(() => {
    const firstField = Object.keys(state.fieldErrors ?? {})[0];
    if (firstField) form.setFocus(firstField as keyof ServiceFormValues);
  }, [form, state.fieldErrors]);

  const submit = form.handleSubmit((values) => {
    const data = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      data.set(key, String(value ?? ""));
    });
    startTransition(() => dispatch(data));
  });
  const errorFor = (field: keyof ServiceFormValues) =>
    form.formState.errors[field]?.message?.toString() ??
    state.fieldErrors?.[field]?.[0];
  const describedBy = (field: keyof ServiceFormValues) =>
    errorFor(field) ? `${field}-error` : undefined;

  return (
    <form className="space-y-3" noValidate onSubmit={submit}>
      <FormMessage message={state.message} tone="error" />

      <section className="overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
        <SectionTitle
          description="Como o serviço será localizado e agrupado no catálogo"
          icon={Wrench}
          title="Identificação"
        />
        <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1.5fr)_minmax(14rem,0.8fr)] sm:p-5">
          <label className="text-sm font-semibold" htmlFor="name">
            Nome do serviço <span className="text-[var(--danger)]">*</span>
            <input
              {...form.register("name")}
              aria-describedby={describedBy("name")}
              aria-invalid={Boolean(errorFor("name"))}
              className={inputClassName}
              id="name"
              maxLength={100}
              placeholder="Ex.: Higienização do ar-condicionado"
            />
            <ErrorText id="name-error" message={errorFor("name")} />
          </label>
          <label className="text-sm font-semibold" htmlFor="category">
            Categoria <span className="text-[var(--danger)]">*</span>
            <select
              {...form.register("category")}
              aria-describedby={describedBy("category")}
              aria-invalid={Boolean(errorFor("category"))}
              className={inputClassName}
              id="category"
            >
              <option value="">Selecione uma categoria</option>
              {SERVICE_CATEGORY_VALUES.map((category) => (
                <option key={category} value={category}>
                  {SERVICE_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
            <ErrorText id="category-error" message={errorFor("category")} />
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
        <SectionTitle
          description="Referência inicial para novos orçamentos"
          icon={BadgeDollarSign}
          title="Precificação"
        />
        <div className="p-4 sm:p-5">
          <label className="block max-w-sm text-sm font-semibold" htmlFor="basePrice">
            Valor-base
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 mt-0.5 -translate-y-1/2 text-base text-[var(--ink-muted)]"
              >
                R$
              </span>
              <input
                {...form.register("basePrice")}
                aria-describedby={`${describedBy("basePrice") ?? ""} basePrice-help`.trim()}
                aria-invalid={Boolean(errorFor("basePrice"))}
                className={`${inputClassName} pl-11 tabular-nums`}
                id="basePrice"
                inputMode="decimal"
                placeholder="0,00"
              />
            </div>
            <ErrorText id="basePrice-error" message={errorFor("basePrice")} />
          </label>
          <p className="mt-2 text-xs leading-5 text-[var(--ink-muted)]" id="basePrice-help">
            Deixe em branco quando o preço depender do veículo ou do diagnóstico.
            O valor poderá ser ajustado na ordem de serviço.
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
        <SectionTitle
          description="Explique o que está incluído para facilitar o orçamento"
          icon={FileText}
          title="Detalhes"
        />
        <div className="p-4 sm:p-5">
          <label className="text-sm font-semibold" htmlFor="description">
            Descrição
            <textarea
              {...form.register("description")}
              aria-describedby={describedBy("description")}
              aria-invalid={Boolean(errorFor("description"))}
              className={`${inputClassName} min-h-32 resize-y py-3`}
              id="description"
              maxLength={1000}
              placeholder="Informe o escopo e os principais procedimentos do serviço"
            />
            <ErrorText
              id="description-error"
              message={errorFor("description")}
            />
          </label>
        </div>
      </section>

      <div className="sticky bottom-0 z-10 flex flex-col-reverse gap-2 border-t bg-[var(--canvas)]/95 py-3 backdrop-blur sm:flex-row sm:justify-end">
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
          href={serviceId ? `/servicos/${serviceId}` : "/servicos"}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Cancelar
        </Link>
        <Button disabled={pending} type="submit">
          {pending ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Save aria-hidden="true" className="size-4" />
          )}
          {pending
            ? "Salvando..."
            : serviceId
              ? "Salvar alterações"
              : "Cadastrar serviço"}
        </Button>
      </div>
    </form>
  );
}
