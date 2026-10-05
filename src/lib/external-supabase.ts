import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const EXTERNAL_SUPABASE_URL = "https://rsxcdswlnktbhiflzgfs.supabase.co";
export const EXTERNAL_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_99JgNlecH1YEAn-SpNBDqg_BDbcHYoq";

function createExternalSupabaseClient() {
  return createClient<Database>(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: typeof window === "undefined" ? undefined : window.localStorage,
    },
  });
}

let client: ReturnType<typeof createExternalSupabaseClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createExternalSupabaseClient>, {
  get(_, property, receiver) {
    if (!client) client = createExternalSupabaseClient();
    return Reflect.get(client, property, receiver);
  },
});