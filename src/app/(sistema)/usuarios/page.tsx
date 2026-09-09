import { ShieldCheck, UserPlus, UsersRound } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { InviteUserForm } from "@/features/usuarios/components/invite-user-form";
import { listManagedUsers } from "@/features/usuarios/queries";
import { updateUserAction } from "@/features/usuarios/actions";
import { requirePermission } from "@/lib/auth/guards";

const roleLabel = {
  administrador: "Administrador",
  atendente: "Atendente",
};

export default async function UsersPage() {
  const currentUser = await requirePermission("usuarios:gerenciar");
  const users = await listManagedUsers();

  return (
    <AppShell
      currentPath="/usuarios"
      description="Gerencie o acesso da equipe"
      title="Usuários"
      user={currentUser}
    >
      <div className="min-h-[calc(100dvh-5.35rem)] px-3 py-3 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[96rem]">
          <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,2.25fr)_minmax(20rem,0.95fr)]">
            <section
              aria-labelledby="usuarios-cadastrados"
              className="min-w-0 overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]"
            >
              <div className="flex items-center gap-3 border-b px-4 py-3.5">
                <UsersRound aria-hidden="true" className="size-5 shrink-0 text-[var(--action)]" />
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-[var(--brand)]" id="usuarios-cadastrados">
                    Funcionários cadastrados
                  </h2>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {users.length} conta{users.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              {users.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <ShieldCheck aria-hidden="true" className="mx-auto size-8 text-[var(--ink-faint)]" />
                  <p className="mt-3 text-sm font-semibold">Nenhum funcionário cadastrado.</p>
                  <p className="mt-1 text-xs text-[var(--ink-muted)]">
                    Envie o primeiro convite usando o formulário ao lado.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[42rem] border-collapse text-left">
                    <thead>
                      <tr className="border-b bg-[var(--surface-subtle)] text-2xs font-bold uppercase tracking-[0.06em] text-[var(--ink-faint)]">
                        <th className="px-4 py-2.5" scope="col">Funcionário</th>
                        <th className="px-3 py-2.5" scope="col">Perfil</th>
                        <th className="px-3 py-2.5" scope="col">Situação</th>
                        <th className="px-3 py-2.5 text-right" scope="col">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr className="border-b last:border-b-0 hover:bg-[var(--surface-subtle)]" key={user.id}>
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold text-[var(--ink)]">{user.name}</p>
                            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">{user.email}</p>
                          </td>
                          <td className="px-3 py-3 text-xs font-semibold text-[var(--ink)]">
                            {roleLabel[user.role]}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-2xs font-bold ring-1 ring-inset ${user.active ? "bg-emerald-50 text-emerald-800 ring-emerald-700/15" : "bg-slate-100 text-slate-700 ring-slate-500/20"}`}
                            >
                              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
                              {user.active ? "Ativa" : "Inativa"}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <form action={updateUserAction}>
                              <input name="userId" type="hidden" value={user.id} />
                              <input name="name" type="hidden" value={user.name} />
                              <input name="role" type="hidden" value={user.role} />
                              <input name="active" type="hidden" value={String(!user.active)} />
                              <button
                                className="min-h-11 rounded-lg px-3 text-xs font-semibold text-[var(--action)] hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                                type="submit"
                              >
                                {user.active ? "Inativar" : "Ativar"}
                              </button>
                            </form>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <aside className="h-fit rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
              <div className="flex items-start gap-3 border-b px-4 py-3.5">
                <div
                  aria-hidden="true"
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)]"
                >
                  <UserPlus className="size-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-[var(--brand)]">Convidar funcionário</h2>
                  <p className="text-xs text-[var(--ink-muted)]">
                    A senha será definida pelo próprio usuário.
                  </p>
                </div>
              </div>
              <div className="p-4">
                <InviteUserForm />
              </div>
            </aside>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 px-0.5 pb-1 pt-5 text-xs text-[var(--ink-muted)]">
            <span>Mundo Ar Climatização © 2026 • Sistema de Gestão da Oficina</span>
            <span className="tabular-nums">Versão 0.1.0</span>
          </footer>
        </div>
      </div>
    </AppShell>
  );
}
