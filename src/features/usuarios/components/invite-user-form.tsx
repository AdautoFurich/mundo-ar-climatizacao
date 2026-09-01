"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Send } from "lucide-react";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormMessage } from "@/components/shared/form-message";
import { Button } from "@/components/ui/button";
import { INITIAL_ACTION_STATE } from "@/features/auth/types";
import { inviteUserAction } from "../actions";
import { inviteUserSchema } from "../schemas";

const fieldClassName =
  "mt-1.5 min-h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3.5 text-base outline-none focus:border-[var(--action)] focus:ring-2 focus:ring-[var(--focus)]/25";

export function InviteUserForm() {
  type Values = z.infer<typeof inviteUserSchema>;
  const [state, action, pending] = useActionState(
    inviteUserAction,
    INITIAL_ACTION_STATE,
  );
  const form = useForm<Values>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { name: "", email: "", role: "atendente" },
  });
  const submit = form.handleSubmit((values) => {
    const data = new FormData();
    data.set("name", values.name);
    data.set("email", values.email);
    data.set("role", values.role);
    startTransition(() => action(data));
  });

  return (
    <form className="grid gap-4" noValidate onSubmit={submit}>
      <FormMessage
        message={state.message}
        tone={state.status === "success" ? "success" : "error"}
      />
      <div>
        <label className="text-sm font-semibold" htmlFor="invite-name">Nome</label>
        <input {...form.register("name")} className={fieldClassName} id="invite-name" />
        {form.formState.errors.name?.message && <p className="mt-1 text-sm text-red-700">{form.formState.errors.name.message}</p>}
      </div>
      <div>
        <label className="text-sm font-semibold" htmlFor="invite-email">E-mail</label>
        <input {...form.register("email")} autoComplete="off" className={fieldClassName} id="invite-email" type="email" />
        {form.formState.errors.email?.message && <p className="mt-1 text-sm text-red-700">{form.formState.errors.email.message}</p>}
      </div>
      <div>
        <label className="text-sm font-semibold" htmlFor="invite-role">Perfil</label>
        <select {...form.register("role")} className={fieldClassName} id="invite-role">
          <option value="administrador">Administrador</option>
          <option value="atendente">Atendente</option>
          <option value="tecnico">Técnico</option>
        </select>
      </div>
      <Button disabled={pending} type="submit">
        {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Send aria-hidden="true" className="size-4" />}
        {pending ? "Enviando..." : "Enviar convite"}
      </Button>
    </form>
  );
}
