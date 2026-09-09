"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, FileSearch, LoaderCircle, Save } from "lucide-react";
import { startTransition, useActionState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";

import { FormMessage } from "@/components/shared/form-message";
import { Button } from "@/components/ui/button";
import { saveDiagnosisAction } from "../actions/diagnostics";
import { formatOrderDateTimeInput } from "../formatters";
import {
  diagnosisSchema,
  type DiagnosisData,
  type DiagnosisInput,
} from "../schemas";
import { INITIAL_ORDER_ACTION_STATE } from "../types";

const inputClassName =
  "mt-1.5 min-h-11 w-full rounded-lg border bg-white px-3.5 text-base text-[var(--ink)] outline-none placeholder:text-slate-400 focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/20 aria-[invalid=true]:border-[var(--danger)] aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-100";

function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-sm text-[var(--danger)]" id={id} role="alert">
      {message}
    </p>
  );
}

export function DiagnosisForm({
  expectedCompletionAt,
  orderId,
  version,
}: {
  expectedCompletionAt: string | null;
  orderId: string;
  version: number;
}) {
  const action = useMemo(
    () => saveDiagnosisAction.bind(null, orderId),
    [orderId],
  );
  const [state, dispatch, pending] = useActionState(
    action,
    INITIAL_ORDER_ACTION_STATE,
  );
  const form = useForm<DiagnosisInput, unknown, DiagnosisData>({
    resolver: zodResolver(diagnosisSchema),
    defaultValues: {
      description: "",
      notes: "",
      expectedCompletionAt: formatOrderDateTimeInput(expectedCompletionAt),
      expectedVersion: String(version),
    },
    shouldFocusError: true,
  });

  useEffect(() => {
    const firstField = Object.keys(state.fieldErrors ?? {})[0];
    if (firstField) form.setFocus(firstField as keyof DiagnosisInput);
  }, [form, state.fieldErrors]);

  const submit = form.handleSubmit((values) => {
    const data = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      data.set(key, String(value ?? ""));
    });
    startTransition(() => dispatch(data));
  });

  const errorFor = (field: keyof DiagnosisInput) =>
    form.formState.errors[field]?.message?.toString() ??
    state.fieldErrors?.[field]?.[0];

  return (
    <form
      className="mb-4 rounded-lg border border-teal-100 bg-teal-50/40 p-4"
      id="diagnostico-form"
      noValidate
      onSubmit={submit}
    >
      <div className="mb-4 flex items-start gap-3">
        <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-[var(--action)] shadow-sm">
          <FileSearch className="size-4.5" />
        </span>
        <div>
          <h3 className="font-display text-lg font-bold text-[var(--brand)]">Registrar diagnóstico</h3>
          <p className="text-xs text-[var(--ink-muted)]">Um novo registro preserva as análises anteriores no histórico.</p>
        </div>
      </div>

      <FormMessage message={state.message} tone="error" />
      <input {...form.register("expectedVersion")} type="hidden" />

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(15rem,0.5fr)]">
        <label className="text-sm font-semibold" htmlFor="description">
          Diagnóstico técnico <span className="text-[var(--danger)]">*</span>
          <textarea
            {...form.register("description")}
            aria-describedby={errorFor("description") ? "description-error" : undefined}
            aria-invalid={Boolean(errorFor("description"))}
            className={`${inputClassName} min-h-32 resize-y py-3`}
            id="description"
            maxLength={5000}
            placeholder="Descreva as verificações realizadas e a causa identificada"
          />
          <ErrorText id="description-error" message={errorFor("description")} />
        </label>

        <label className="text-sm font-semibold" htmlFor="expectedCompletionAt">
          <span className="flex items-center gap-1.5">
            <CalendarClock aria-hidden="true" className="size-4 text-[var(--action)]" />
            Previsão de conclusão
          </span>
          <input
            {...form.register("expectedCompletionAt")}
            aria-describedby={errorFor("expectedCompletionAt") ? "expectedCompletionAt-error" : undefined}
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

        <label className="text-sm font-semibold lg:col-span-2" htmlFor="notes">
          Observações técnicas
          <textarea
            {...form.register("notes")}
            aria-describedby={errorFor("notes") ? "notes-error" : undefined}
            aria-invalid={Boolean(errorFor("notes"))}
            className={`${inputClassName} min-h-24 resize-y py-3`}
            id="notes"
            maxLength={2000}
            placeholder="Testes adicionais, recomendações ou pontos de atenção"
          />
          <ErrorText id="notes-error" message={errorFor("notes")} />
        </label>
      </div>

      <div className="mt-4 flex justify-end">
        <Button disabled={pending} type="submit">
          {pending ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Save aria-hidden="true" className="size-4" />
          )}
          {pending ? "Salvando diagnóstico..." : "Salvar diagnóstico"}
        </Button>
      </div>
    </form>
  );
}
