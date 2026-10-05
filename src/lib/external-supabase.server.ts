import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { EXTERNAL_SUPABASE_URL } from "./external-supabase";

function createExternalSupabaseAdmin() {
  const serviceRoleKey = process.env["EXTERNAL_SUPABASE_SERVICE_ROLE_KEY"];
  if (!serviceRoleKey) throw new Error("External Supabase service-role key is not configured");

  return createClient<Database>(EXTERNAL_SUPABASE_URL, serviceRoleKey, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let client: ReturnType<typeof createExternalSupabaseAdmin> | undefined;

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createExternalSupabaseAdmin>, {
  get(_, property, receiver) {
    if (!client) client = createExternalSupabaseAdmin();
    return Reflect.get(client, property, receiver);
  },
});