import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const allowedTypes: EmailOtpType[] = ["invite", "recovery"];

function safeNext(value: string | null) {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return "/atualizar-senha";
  }
  return value;
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const destination = safeNext(request.nextUrl.searchParams.get("next"));

  if (isSupabaseConfigured() && tokenHash && type && allowedTypes.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

    if (!error) return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.redirect(
    new URL("/esqueci-senha?erro=link-invalido", request.url),
  );
}
