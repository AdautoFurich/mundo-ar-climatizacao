import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";

import { RecoveryForm } from "@/features/auth/components/auth-forms";

export default function ForgotPasswordPage() {
  return (
    <div>
      <Link className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href="/login">
        <ArrowLeft aria-hidden="true" className="size-4" /> Voltar ao login
      </Link>
      <div className="mb-8">
        <div className="mb-4 grid size-10 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
          <Mail aria-hidden="true" className="size-5" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--action)]">Recuperar acesso</p>
        <h2 className="font-display mt-2 text-4xl font-bold tracking-tight text-[var(--brand)]">Redefinir a senha</h2>
        <p className="mt-3 leading-7 text-[var(--ink-muted)]">Informe seu e-mail. Se a conta existir, você receberá um link seguro.</p>
      </div>
      <RecoveryForm />
    </div>
  );
}
