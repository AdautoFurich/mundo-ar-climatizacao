import { LockKeyhole } from "lucide-react";

import { LoginForm } from "@/features/auth/components/auth-forms";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div>
      <div className="mb-8">
        <div className="mb-4 grid size-10 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
          <LockKeyhole aria-hidden="true" className="size-5" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--action)]">Acesso da equipe</p>
        <h2 className="font-display mt-2 text-4xl font-bold tracking-tight text-[var(--brand)]">Entrar no sistema</h2>
        <p className="mt-3 leading-7 text-[var(--ink-muted)]">Use a conta fornecida pelo administrador da oficina.</p>
      </div>
      <LoginForm next={next} />
    </div>
  );
}
