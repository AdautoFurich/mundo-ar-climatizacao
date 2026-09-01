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
      <header className="text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full border border-teal-700/5 bg-teal-50 text-[var(--brand)] shadow-[0_2px_4px_rgba(16,45,63,0.12)]">
          <LockKeyhole aria-hidden="true" className="size-8" strokeWidth={1.8} />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[var(--action)]">
          Acesso da equipe
        </p>
        <h2 className="font-display mt-2 text-4xl font-bold tracking-tight text-[var(--brand)]">
          Entrar no sistema
        </h2>
        <p className="mt-2 text-base text-[var(--ink-muted)]">
          Use a conta fornecida pelo administrador da oficina.
        </p>
      </header>

      <div className="mt-8">
        <LoginForm next={next} />
      </div>
    </div>
  );
}
