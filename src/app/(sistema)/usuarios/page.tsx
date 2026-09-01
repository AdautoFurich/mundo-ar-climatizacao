import { ShieldCheck, UserPlus, UsersRound } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { InviteUserForm } from "@/features/usuarios/components/invite-user-form";
import { listManagedUsers } from "@/features/usuarios/queries";
import { updateUserAction } from "@/features/usuarios/actions";
import { requirePermission } from "@/lib/auth/guards";

const roleLabel = {
  administrador: "Administrador",
  atendente: "Atendente",
  tecnico: "Técnico",
};

export default async function UsersPage() {
  const currentUser = await requirePermission("usuarios:gerenciar");
  const users = await listManagedUsers();

  return (
    <AppShell currentPath="/usuarios" user={currentUser}>
      <div className="min-h-[calc(100vh-4rem)] bg-[var(--canvas)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[90rem]">
          <header className="border-b border-[var(--border)] pb-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--action)]">Administração</p>
            <h1 className="font-display mt-2 text-4xl font-bold text-[var(--brand)]">Usuários e acessos</h1>
            <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">Convide funcionários e mantenha cada conta com o perfil necessário para o trabalho.</p>
          </header>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.65fr)]">
            <section className="overflow-hidden rounded-xl border bg-white shadow-sm" aria-labelledby="usuarios-cadastrados">
              <div className="flex items-center gap-3 border-b px-5 py-4">
                <UsersRound aria-hidden="true" className="size-5 text-[var(--action)]" />
                <div><h2 className="font-display text-xl font-bold text-[var(--brand)]" id="usuarios-cadastrados">Funcionários cadastrados</h2><p className="text-sm text-[var(--ink-muted)]">{users.length} conta{users.length === 1 ? "" : "s"}</p></div>
              </div>
              {users.length === 0 ? (
                <div className="px-5 py-12 text-center"><ShieldCheck aria-hidden="true" className="mx-auto size-8 text-[var(--ink-faint)]" /><p className="mt-3 font-semibold">Nenhum funcionário cadastrado.</p><p className="mt-1 text-sm text-[var(--ink-muted)]">Envie o primeiro convite usando o formulário ao lado.</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[48rem] text-left">
                    <thead><tr className="border-b bg-[var(--surface-subtle)] text-xs font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"><th className="px-5 py-3">Funcionário</th><th className="px-5 py-3">Perfil</th><th className="px-5 py-3">Situação</th><th className="px-5 py-3 text-right">Ação</th></tr></thead>
                    <tbody>
                      {users.map((user) => (
                        <tr className="border-b last:border-0" key={user.id}>
                          <td className="px-5 py-4"><p className="font-semibold text-[var(--ink)]">{user.name}</p><p className="mt-0.5 text-sm text-[var(--ink-muted)]">{user.email}</p></td>
                          <td className="px-5 py-4 text-sm font-semibold">{roleLabel[user.role]}</td>
                          <td className="px-5 py-4"><span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${user.active ? "bg-emerald-50 text-emerald-800 ring-emerald-700/15" : "bg-slate-100 text-slate-700 ring-slate-500/20"}`}><span aria-hidden="true" className="size-1.5 rounded-full bg-current" />{user.active ? "Ativa" : "Inativa"}</span></td>
                          <td className="px-5 py-4 text-right">
                            <form action={updateUserAction}>
                              <input name="userId" type="hidden" value={user.id} /><input name="name" type="hidden" value={user.name} /><input name="role" type="hidden" value={user.role} /><input name="active" type="hidden" value={String(!user.active)} />
                              <button className="min-h-11 rounded-lg px-3 text-sm font-semibold text-[var(--action)] hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" type="submit">{user.active ? "Inativar" : "Ativar"}</button>
                            </form>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <aside className="h-fit rounded-xl border bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-start gap-3 border-b pb-4"><div className="grid size-10 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]"><UserPlus aria-hidden="true" className="size-5" /></div><div><h2 className="font-display text-xl font-bold text-[var(--brand)]">Convidar funcionário</h2><p className="mt-1 text-sm text-[var(--ink-muted)]">A senha será definida pelo próprio usuário.</p></div></div>
              <InviteUserForm />
            </aside>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
