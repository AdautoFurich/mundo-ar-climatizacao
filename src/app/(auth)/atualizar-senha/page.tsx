import { KeyRound } from "lucide-react";

import { UpdatePasswordForm } from "@/features/auth/components/auth-forms";

export default function UpdatePasswordPage() {
  return (
    <div>
      <div className="mb-8">
        <div className="mb-4 grid size-10 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
          <KeyRound aria-hidden="true" className="size-5" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--action)]">Proteção da conta</p>
        <h2 className="font-display mt-2 text-4xl font-bold tracking-tight text-[var(--brand)]">Crie uma nova senha</h2>
        <p className="mt-3 leading-7 text-[var(--ink-muted)]">A nova senha será usada nos próximos acessos ao sistema.</p>
      </div>
      <UpdatePasswordForm />
    </div>
  );
}
