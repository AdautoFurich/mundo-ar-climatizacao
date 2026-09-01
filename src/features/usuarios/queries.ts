import "server-only";

import { requirePermission } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ManagedUser } from "./types";

export async function listManagedUsers(): Promise<ManagedUser[]> {
  await requirePermission("usuarios:gerenciar");

  const supabase = await createClient();
  const admin = createAdminClient();
  const [{ data: profiles, error: profilesError }, { data: authUsers, error: usersError }] =
    await Promise.all([
      supabase
        .from("perfis_usuarios")
        .select("id, nome, perfil, ativo, criado_em")
        .order("nome"),
      admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    ]);

  if (profilesError || usersError) {
    throw new Error("Não foi possível carregar os funcionários.");
  }

  const emails = new Map(
    authUsers.users.map((user) => [user.id, user.email ?? "E-mail indisponível"]),
  );

  return profiles.map((profile) => ({
    id: profile.id,
    name: profile.nome,
    email: emails.get(profile.id) ?? "E-mail indisponível",
    role: profile.perfil,
    active: profile.ativo,
    createdAt: profile.criado_em,
  }));
}
