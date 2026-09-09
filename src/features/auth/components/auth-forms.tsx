"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  Mail,
  Send,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/shared/form-message";
import {
  loginAction,
  requestPasswordRecoveryAction,
  updatePasswordAction,
} from "@/features/auth/actions";
import {
  loginSchema,
  recoverySchema,
  updatePasswordSchema,
} from "@/features/auth/schemas";
import { INITIAL_ACTION_STATE } from "@/features/auth/types";

const fieldClassName =
  "min-h-14 w-full rounded-lg border border-[var(--border)] bg-white px-3.5 text-base text-[var(--ink)] shadow-[0_1px_1px_rgba(15,35,47,0.03)] outline-none transition placeholder:text-slate-500 focus:border-[var(--action)] focus:ring-2 focus:ring-[var(--focus)]/25";

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p className="mt-1.5 text-sm font-medium text-red-700" id={id}>
      {messages[0]}
    </p>
  );
}

function PasswordField({
  id,
  label,
  error,
  registration,
}: {
  id: string;
  label: string;
  error?: string[];
  registration: ReturnType<ReturnType<typeof useForm>["register"]>;
}) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div>
      <label className="text-sm font-semibold text-[var(--ink)]" htmlFor={id}>
        {label}
      </label>
      <div className="relative mt-1.5">
        <LockKeyhole
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--ink-faint)]"
        />
        <input
          {...registration}
          aria-describedby={error?.length ? errorId : undefined}
          aria-invalid={Boolean(error?.length)}
          autoComplete={id === "password" ? "current-password" : "new-password"}
          className={`${fieldClassName} pl-12 pr-12`}
          id={id}
          type={visible ? "text" : "password"}
        />
        <button
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          className="absolute inset-y-0 right-0 grid min-w-11 place-items-center rounded-r-lg text-[var(--ink-muted)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus)]"
          onClick={() => setVisible((value) => !value)}
          type="button"
        >
          {visible ? (
            <EyeOff aria-hidden="true" className="size-4" />
          ) : (
            <Eye aria-hidden="true" className="size-4" />
          )}
        </button>
      </div>
      <FieldError id={errorId} messages={error} />
    </div>
  );
}

export function LoginForm({ next = "/" }: { next?: string }) {
  type Values = z.infer<typeof loginSchema>;
  const [state, action, pending] = useActionState(
    loginAction,
    INITIAL_ACTION_STATE,
  );
  const form = useForm<Values>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (state.status === "error") form.resetField("password");
  }, [form, state.status]);

  const submit = form.handleSubmit((values) => {
    const data = new FormData();
    data.set("email", values.email);
    data.set("password", values.password);
    data.set("next", next);
    startTransition(() => action(data));
  });

  return (
    <form className="grid gap-5" noValidate onSubmit={submit}>
      <FormMessage message={state.message} />
      <div>
        <label className="text-sm font-semibold text-[var(--ink)]" htmlFor="email">
          E-mail
        </label>
        <div className="relative mt-1.5">
          <Mail
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--ink-faint)]"
          />
          <input
            {...form.register("email")}
            aria-describedby="email-error"
            aria-invalid={Boolean(form.formState.errors.email || state.fieldErrors?.email)}
            autoComplete="email"
            className={`${fieldClassName} pl-12`}
            id="email"
            inputMode="email"
            placeholder="nome@empresa.com.br"
            type="email"
          />
        </div>
        <FieldError
          id="email-error"
          messages={
            form.formState.errors.email?.message
              ? [form.formState.errors.email.message]
              : state.fieldErrors?.email
          }
        />
      </div>
      <PasswordField
        error={
          form.formState.errors.password?.message
            ? [form.formState.errors.password.message]
            : state.fieldErrors?.password
        }
        id="password"
        label="Senha"
        registration={form.register("password")}
      />
      <div className="flex items-center justify-end">
        <Link
          className="rounded text-sm font-semibold text-[var(--action)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
          href="/esqueci-senha"
        >
          Esqueci minha senha
        </Link>
      </div>
      <Button className="min-h-14 w-full shadow-[0_12px_24px_rgba(15,118,110,0.2)]" disabled={pending} type="submit">
        {pending ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <LogIn aria-hidden="true" className="size-4" />
        )}
        {pending ? "Entrando..." : "Entrar no sistema"}
      </Button>
    </form>
  );
}

export function RecoveryForm() {
  type Values = z.infer<typeof recoverySchema>;
  const [state, action, pending] = useActionState(
    requestPasswordRecoveryAction,
    INITIAL_ACTION_STATE,
  );
  const form = useForm<Values>({
    resolver: zodResolver(recoverySchema),
    defaultValues: { email: "" },
  });
  const submit = form.handleSubmit((values) => {
    const data = new FormData();
    data.set("email", values.email);
    startTransition(() => action(data));
  });

  return (
    <form className="grid gap-5" noValidate onSubmit={submit}>
      <FormMessage
        message={state.message}
        tone={state.status === "success" ? "success" : "error"}
      />
      <div>
        <label className="text-sm font-semibold text-[var(--ink)]" htmlFor="email">
          E-mail da conta
        </label>
        <div className="relative mt-1.5">
          <Mail
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--ink-faint)]"
          />
          <input
            {...form.register("email")}
            aria-describedby="email-error"
            aria-invalid={Boolean(form.formState.errors.email || state.fieldErrors?.email)}
            autoComplete="email"
            className={`${fieldClassName} pl-12`}
            id="email"
            inputMode="email"
            placeholder="nome@empresa.com.br"
            type="email"
          />
        </div>
        <FieldError
          id="email-error"
          messages={
            form.formState.errors.email?.message
              ? [form.formState.errors.email.message]
              : undefined
          }
        />
      </div>
      <Button className="min-h-14 w-full shadow-[0_12px_24px_rgba(15,118,110,0.2)]" disabled={pending} type="submit">
        {pending ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <Send aria-hidden="true" className="size-4" />
        )}
        {pending ? "Enviando..." : "Enviar instruções"}
      </Button>
    </form>
  );
}

export function UpdatePasswordForm() {
  type Values = z.infer<typeof updatePasswordSchema>;
  const [state, action, pending] = useActionState(
    updatePasswordAction,
    INITIAL_ACTION_STATE,
  );
  const form = useForm<Values>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const submit = form.handleSubmit((values) => {
    const data = new FormData();
    data.set("password", values.password);
    data.set("confirmPassword", values.confirmPassword);
    startTransition(() => action(data));
  });

  return (
    <form className="grid gap-5" noValidate onSubmit={submit}>
      <FormMessage
        message={state.message}
        tone={state.status === "success" ? "success" : "error"}
      />
      <PasswordField
        error={
          form.formState.errors.password?.message
            ? [form.formState.errors.password.message]
            : state.fieldErrors?.password
        }
        id="new-password"
        label="Nova senha"
        registration={form.register("password")}
      />
      <PasswordField
        error={
          form.formState.errors.confirmPassword?.message
            ? [form.formState.errors.confirmPassword.message]
            : state.fieldErrors?.confirmPassword
        }
        id="confirm-password"
        label="Confirme a nova senha"
        registration={form.register("confirmPassword")}
      />
      <p className="text-sm leading-6 text-[var(--ink-muted)]">
        Use pelo menos 8 caracteres, com letra, número e caractere especial.
      </p>
      <Button className="w-full" disabled={pending || state.status === "success"} type="submit">
        {pending ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <ShieldCheck aria-hidden="true" className="size-4" />
        )}
        {pending ? "Atualizando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
}
