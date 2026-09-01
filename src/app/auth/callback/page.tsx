"use client";

import { LoaderCircle, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

function safeDestination(value: string | null) {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return "/atualizar-senha";
  }
  return value;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    async function establishSession() {
      const url = new URL(window.location.href);
      const destination = safeDestination(url.searchParams.get("next"));
      const code = url.searchParams.get("code");
      const fragment = new URLSearchParams(url.hash.replace(/^#/, ""));
      const accessToken = fragment.get("access_token");
      const refreshToken = fragment.get("refresh_token");
      const supabase = createClient();

      const result = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : accessToken && refreshToken
          ? await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
          : { error: new Error("Credenciais ausentes no retorno.") };

      if (result.error) {
        setFailed(true);
        return;
      }

      router.replace(destination);
      router.refresh();
    }

    void establishSession();
  }, [router]);

  if (failed) {
    return (
      <div className="mx-auto max-w-md rounded-xl border bg-white p-6 text-center shadow-sm">
        <TriangleAlert aria-hidden="true" className="mx-auto size-8 text-[var(--warning)]" />
        <h1 className="font-display mt-4 text-2xl font-bold text-[var(--brand)]">Link inválido ou expirado</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">Solicite um novo link para recuperar o acesso.</p>
        <Link className="mt-5 inline-flex min-h-11 items-center rounded-lg px-4 font-semibold text-[var(--action)] hover:bg-teal-50" href="/esqueci-senha">Solicitar novo link</Link>
      </div>
    );
  }

  return (
    <div className="text-center" role="status">
      <LoaderCircle aria-hidden="true" className="mx-auto size-8 animate-spin text-[var(--action)]" />
      <h1 className="font-display mt-4 text-2xl font-bold text-[var(--brand)]">Validando seu acesso</h1>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">Aguarde alguns instantes.</p>
    </div>
  );
}
