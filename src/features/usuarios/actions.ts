"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/features/auth/types";
import { getSiteUrl } from "@/lib/env";
import { requirePermission } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { inviteUserSchema, updateUserSchema } from "./schemas";

export async function inviteUserAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("usuarios:gerenciar");
  const parsed = inviteUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos indicados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    data: { nome: parsed.data.name, perfil: parsed.data.role },
    redirectTo: `${getSiteUrl()}/auth/callback?next=/atualizar-senha`,
  });

  if (error) {
    return {
      status: "error",
      message: error.code === "email_exists" || error.status === 422
        ? "Já existe uma conta com este e-mail."
        : "Não foi possível enviar o convite agora.",
    };
  }

  revalidatePath("/usuarios");
  return { status: "success", message: "Convite enviado ao funcionário." };
}

export async function updateUserAction(formData: FormData) {
  const currentUser = await requirePermission("usuarios:gerenciar");
  const parsed = updateUserSchema.safeParse({
    userId: formData.get("userId"),
    name: formData.get("name"),
    role: formData.get("role"),
    active: formData.get("active") === "true",
  });

  if (!parsed.success || parsed.data.userId === currentUser.id) {
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("perfis_usuarios")
    .update({
      nome: parsed.data.name,
      perfil: parsed.data.role,
      ativo: parsed.data.active,
    })
    .eq("id", parsed.data.userId);

  revalidatePath("/usuarios");
}
