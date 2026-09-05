"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Contact,
  FileText,
  LoaderCircle,
  MapPin,
  Save,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormMessage } from "@/components/shared/form-message";
import { Button } from "@/components/ui/button";
import { createClientAction, updateClientAction } from "../actions";
import { formatCpf, formatPhone, formatZipCode } from "../formatters";
import { clientFormSchema } from "../schemas";
import {
  INITIAL_CLIENT_ACTION_STATE,
  type ClientFormValues,
} from "../types";

const inputClassName =
  "mt-1.5 min-h-11 w-full rounded-lg border bg-white px-3.5 text-base text-[var(--ink)] outline-none placeholder:text-slate-400 focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/20 aria-[invalid=true]:border-[var(--danger)] aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-100";

type ParsedClient = z.output<typeof clientFormSchema>;

const emptyValues: ClientFormValues = {
  name: "",
  cpf: "",
  primaryPhone: "",
  alternatePhone: "",
  email: "",
  zipCode: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  notes: "",
};

function SectionTitle({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof UserRound;
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

export function ClientForm({
  clientId,
  defaultValues = emptyValues,
}: {
  clientId?: string;
  defaultValues?: ClientFormValues;
}) {
  const serverAction = useMemo(
    () =>
      clientId
        ? updateClientAction.bind(null, clientId)
        : createClientAction,
    [clientId],
  );
  const [state, dispatch, pending] = useActionState(
    serverAction,
    INITIAL_CLIENT_ACTION_STATE,
  );
  const form = useForm<ClientFormValues, unknown, ParsedClient>({
    resolver: zodResolver(clientFormSchema),
    defaultValues,
    shouldFocusError: true,
  });

  useEffect(() => {
    const firstField = Object.keys(state.fieldErrors ?? {})[0];
    if (firstField) form.setFocus(firstField as keyof ClientFormValues);
  }, [form, state.fieldErrors]);

  const submit = form.handleSubmit((values) => {
    const data = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      data.set(key, value ?? "");
    });
    startTransition(() => dispatch(data));
  });

  const errorFor = (field: keyof ClientFormValues) =>
    form.formState.errors[field]?.message?.toString() ??
    state.fieldErrors?.[field]?.[0];
  const describedBy = (field: keyof ClientFormValues) =>
    errorFor(field) ? `${field}-error` : undefined;

  const cpf = form.register("cpf");
  const primaryPhone = form.register("primaryPhone");
  const alternatePhone = form.register("alternatePhone");
  const zipCode = form.register("zipCode");

  return (
    <form className="space-y-3" noValidate onSubmit={submit}>
      <FormMessage message={state.message} tone="error" />

      <section className="overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
        <SectionTitle
          description="Identificação obrigatória do cliente"
          icon={UserRound}
          title="Dados pessoais"
        />
        <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,2fr)_minmax(14rem,1fr)] sm:p-5">
          <label className="text-sm font-semibold" htmlFor="name">
            Nome completo <span className="text-[var(--danger)]">*</span>
            <input
              {...form.register("name")}
              aria-describedby={describedBy("name")}
              aria-invalid={Boolean(errorFor("name"))}
              autoComplete="name"
              className={inputClassName}
              id="name"
              placeholder="Ex.: Maria da Silva"
            />
            <ErrorText id="name-error" message={errorFor("name")} />
          </label>
          <label className="text-sm font-semibold" htmlFor="cpf">
            CPF <span className="text-[var(--danger)]">*</span>
            <input
              {...cpf}
              aria-describedby={describedBy("cpf")}
              aria-invalid={Boolean(errorFor("cpf"))}
              className={inputClassName}
              id="cpf"
              inputMode="numeric"
              onChange={(event) => {
                event.target.value = formatCpf(event.target.value);
                cpf.onChange(event);
              }}
              placeholder="000.000.000-00"
            />
            <ErrorText id="cpf-error" message={errorFor("cpf")} />
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
        <SectionTitle
          description="Canais usados no atendimento da oficina"
          icon={Contact}
          title="Contato"
        />
        <div className="grid gap-4 p-4 md:grid-cols-3 sm:p-5">
          <label className="text-sm font-semibold" htmlFor="primaryPhone">
            Telefone principal <span className="text-[var(--danger)]">*</span>
            <input
              {...primaryPhone}
              aria-describedby={describedBy("primaryPhone")}
              aria-invalid={Boolean(errorFor("primaryPhone"))}
              autoComplete="tel"
              className={inputClassName}
              id="primaryPhone"
              inputMode="tel"
              onChange={(event) => {
                event.target.value = formatPhone(event.target.value);
                primaryPhone.onChange(event);
              }}
              placeholder="(44) 99999-9999"
            />
            <ErrorText
              id="primaryPhone-error"
              message={errorFor("primaryPhone")}
            />
          </label>
          <label className="text-sm font-semibold" htmlFor="alternatePhone">
            Telefone alternativo
            <input
              {...alternatePhone}
              aria-describedby={describedBy("alternatePhone")}
              aria-invalid={Boolean(errorFor("alternatePhone"))}
              className={inputClassName}
              id="alternatePhone"
              inputMode="tel"
              onChange={(event) => {
                event.target.value = formatPhone(event.target.value);
                alternatePhone.onChange(event);
              }}
              placeholder="(44) 3333-3333"
            />
            <ErrorText
              id="alternatePhone-error"
              message={errorFor("alternatePhone")}
            />
          </label>
          <label className="text-sm font-semibold" htmlFor="email">
            E-mail
            <input
              {...form.register("email")}
              aria-describedby={describedBy("email")}
              aria-invalid={Boolean(errorFor("email"))}
              autoComplete="email"
              className={inputClassName}
              id="email"
              placeholder="cliente@exemplo.com.br"
              type="email"
            />
            <ErrorText id="email-error" message={errorFor("email")} />
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
        <SectionTitle
          description="Localização informada pelo cliente"
          icon={MapPin}
          title="Endereço"
        />
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-6 sm:p-5">
          <label className="text-sm font-semibold lg:col-span-1" htmlFor="zipCode">
            CEP <span className="text-[var(--danger)]">*</span>
            <input
              {...zipCode}
              aria-describedby={describedBy("zipCode")}
              aria-invalid={Boolean(errorFor("zipCode"))}
              autoComplete="postal-code"
              className={inputClassName}
              id="zipCode"
              inputMode="numeric"
              onChange={(event) => {
                event.target.value = formatZipCode(event.target.value);
                zipCode.onChange(event);
              }}
              placeholder="00000-000"
            />
            <ErrorText id="zipCode-error" message={errorFor("zipCode")} />
          </label>
          <label className="text-sm font-semibold lg:col-span-4" htmlFor="street">
            Logradouro <span className="text-[var(--danger)]">*</span>
            <input
              {...form.register("street")}
              aria-describedby={describedBy("street")}
              aria-invalid={Boolean(errorFor("street"))}
              autoComplete="street-address"
              className={inputClassName}
              id="street"
            />
            <ErrorText id="street-error" message={errorFor("street")} />
          </label>
          <label className="text-sm font-semibold lg:col-span-1" htmlFor="number">
            Número <span className="text-[var(--danger)]">*</span>
            <input
              {...form.register("number")}
              aria-describedby={describedBy("number")}
              aria-invalid={Boolean(errorFor("number"))}
              className={inputClassName}
              id="number"
            />
            <ErrorText id="number-error" message={errorFor("number")} />
          </label>
          <label className="text-sm font-semibold lg:col-span-2" htmlFor="complement">
            Complemento
            <input
              {...form.register("complement")}
              aria-describedby={describedBy("complement")}
              aria-invalid={Boolean(errorFor("complement"))}
              className={inputClassName}
              id="complement"
            />
            <ErrorText
              id="complement-error"
              message={errorFor("complement")}
            />
          </label>
          <label className="text-sm font-semibold lg:col-span-2" htmlFor="neighborhood">
            Bairro <span className="text-[var(--danger)]">*</span>
            <input
              {...form.register("neighborhood")}
              aria-describedby={describedBy("neighborhood")}
              aria-invalid={Boolean(errorFor("neighborhood"))}
              className={inputClassName}
              id="neighborhood"
            />
            <ErrorText
              id="neighborhood-error"
              message={errorFor("neighborhood")}
            />
          </label>
          <label className="text-sm font-semibold lg:col-span-1" htmlFor="city">
            Cidade <span className="text-[var(--danger)]">*</span>
            <input
              {...form.register("city")}
              aria-describedby={describedBy("city")}
              aria-invalid={Boolean(errorFor("city"))}
              autoComplete="address-level2"
              className={inputClassName}
              id="city"
            />
            <ErrorText id="city-error" message={errorFor("city")} />
          </label>
          <label className="text-sm font-semibold lg:col-span-1" htmlFor="state">
            UF <span className="text-[var(--danger)]">*</span>
            <input
              {...form.register("state")}
              aria-describedby={describedBy("state")}
              aria-invalid={Boolean(errorFor("state"))}
              autoCapitalize="characters"
              autoComplete="address-level1"
              className={inputClassName}
              id="state"
              maxLength={2}
              placeholder="PR"
            />
            <ErrorText id="state-error" message={errorFor("state")} />
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
        <SectionTitle
          description="Informações úteis para os próximos atendimentos"
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
              placeholder="Preferências de contato ou informações relevantes"
            />
            <ErrorText id="notes-error" message={errorFor("notes")} />
          </label>
        </div>
      </section>

      <div className="sticky bottom-0 z-10 flex flex-col-reverse gap-2 border-t bg-[var(--canvas)]/95 py-3 backdrop-blur sm:flex-row sm:justify-end">
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
          href={clientId ? `/clientes/${clientId}` : "/clientes"}
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
          {pending ? "Salvando..." : clientId ? "Salvar alterações" : "Cadastrar cliente"}
        </Button>
      </div>
    </form>
  );
}
