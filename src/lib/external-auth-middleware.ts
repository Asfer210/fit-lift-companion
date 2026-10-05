import { createClient } from "@supabase/supabase-js";
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import type { Database } from "@/integrations/supabase/types";
import { EXTERNAL_SUPABASE_PUBLISHABLE_KEY, EXTERNAL_SUPABASE_URL } from "./external-supabase";

export const requireExternalSupabaseAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const authorization = getRequest()?.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("Unauthorized");

  const token = authorization.slice(7);
  if (token.split(".").length !== 3) throw new Error("Unauthorized");

  const supabase = createClient<Database>(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error("Unauthorized");

  return next({ context: { supabase, userId: data.user.id, claims: data.user.app_metadata } });
});