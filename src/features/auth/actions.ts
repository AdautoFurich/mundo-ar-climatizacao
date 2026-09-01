"use server";

import { redirect } from "next/navigation";

import {
  recoverySchema,
  loginSchema,
  updatePasswordSchema,
} from "./schemas";
import type { ActionState } from "./types";
import { getSiteUrl, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

function invalidFields(error: {
  flatten: () => { fieldErrors: Record<string, string[]> };
}): ActionState {
  return {
    status: "error",
    message: "Revise os campos indicados.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

function safeDestination(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export async function loginAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return invalidFields(parsed.error);

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message:
        "O ambiente de autenticação ainda não foi conectado ao Supabase.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    return {
      status: "error",
      message: "E-mail ou senha inválidos.",
    };
  }

  const { data: profile } = await supabase
    .from("perfis_usuarios")
    .select("ativo")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile?.ativo) {
    await supabase.auth.signOut({ scope: "local" });
    return {
      status: "error",
      message: "Esta conta está inativa. Procure o administrador da oficina.",
    };
  }

  redirect(safeDestination(formData.get("next")));
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
  }

  redirect("/login");
}

export async function requestPasswordRecoveryAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = recoverySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return invalidFields(parsed.error);

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${getSiteUrl()}/auth/callback?next=/atualizar-senha`,
    });
  }

  return {
    status: "success",
    message:
      "Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.",
  };
}

export async function updatePasswordAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return invalidFields(parsed.error);

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "O ambiente de autenticação ainda não foi configurado.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      status: "error",
      message: "O link expirou ou não é válido. Solicite uma nova recuperação.",
    };
  }

  return {
    status: "success",
    message: "Senha atualizada. Você já pode entrar com a nova senha.",
  };
}
