import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { can, type Permission } from "@/features/auth/permissions";
import type { CurrentUser, UserRole } from "@/features/auth/types";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const validRoles: UserRole[] = ["administrador", "atendente", "tecnico"];

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) return null;

  const { data: profile, error: profileError } = await supabase
    .from("perfis_usuarios")
    .select("id, nome, perfil, ativo")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile || !validRoles.includes(profile.perfil)) {
    return null;
  }

  return {
    id: profile.id,
    name: profile.nome,
    email:
      typeof claimsData.claims.email === "string"
        ? claimsData.claims.email
        : "",
    role: profile.perfil,
    active: profile.ativo,
  };
});

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (!user.active) redirect("/conta-inativa");

  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser();

  if (!can(user.role, permission)) redirect("/acesso-negado");

  return user;
}
