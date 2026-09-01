import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import {
  getPublicSupabaseEnvironment,
  getSupabaseSecretKey,
} from "@/lib/env";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const { url } = getPublicSupabaseEnvironment();

  return createSupabaseClient<Database>(url, getSupabaseSecretKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
