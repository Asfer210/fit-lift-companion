import { supabase } from "@/lib/external-supabase";
import type { Database } from "@/integrations/supabase/types";

export type StaffUser = Database["public"]["Tables"]["users"]["Row"];
export const isManager = (u?: StaffUser | null) => !!u && (u.role === "ADMIN" || u.role === "DEVELOPER");

export async function signOut() {
  await supabase.auth.signOut();
}
