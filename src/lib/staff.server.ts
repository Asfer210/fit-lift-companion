import { supabaseAdmin } from "@/lib/external-supabase.server";

export async function assertManager(supabase: { from: typeof supabaseAdmin.from }, userId: string) {
  const { data } = await supabase.from("users").select("role,is_active").eq("id", userId).maybeSingle();
  if (!data || !data.is_active || !["ADMIN", "DEVELOPER"].includes(data.role)) {
    throw new Error("NOT_AUTHORIZED");
  }
}

export async function getTrainer(id: string) {
  const { data } = await supabaseAdmin.from("users").select("*").eq("id", id).maybeSingle();
  if (!data || data.role !== "TRAINER") throw new Error("NOT_AUTHORIZED");
  return data;
}

export { supabaseAdmin };
