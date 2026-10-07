import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireExternalSupabaseAuth } from "@/lib/external-auth-middleware";
import { normalizePhone, phoneToEmail } from "./format";

const category = z.enum(["MALE", "FEMALE", "COMMON"]);

export const createTrainer = createServerFn({ method: "POST" })
  .middleware([requireExternalSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      name: z.string().trim().min(1).max(150),
      username: z.string().trim().min(5).max(30),
      trainer_category: category,
      join_date: z.string().nullable(),
      password: z.string().min(8).max(72),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const phone = normalizePhone(data.username);
    if (!phone) throw new Error("INVALID_PHONE");
    void phoneToEmail;
    const { error } = await (context.supabase as any).rpc("create_trainer", {
      _name: data.name, _phone: phone, _password: data.password,
      _category: data.trainer_category, _join: data.join_date,
    });
    if (error) {
      const m = error.message ?? "";
      if (m.includes("TRAINER_EXISTS")) throw new Error("TRAINER_EXISTS");
      if (m.includes("NOT_AUTHORIZED")) throw new Error("NOT_AUTHORIZED");
      console.error(error);
      throw new Error("CREATE_FAILED");
    }
    return { ok: true };
  });

export const updateTrainer = createServerFn({ method: "POST" })
  .middleware([requireExternalSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      name: z.string().trim().min(1).max(150),
      trainer_category: category,
      join_date: z.string().nullable(),
      is_active: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any).rpc("update_trainer", {
      _id: data.id, _name: data.name, _category: data.trainer_category, _join: data.join_date, _active: data.is_active,
    });
    if (error) { console.error(error); throw new Error(error.message?.includes("NOT_AUTHORIZED") ? "NOT_AUTHORIZED" : "UPDATE_FAILED"); }
    return { ok: true };
  });

export const resetTrainerPassword = createServerFn({ method: "POST" })
  .middleware([requireExternalSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), password: z.string().min(8).max(72) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any).rpc("reset_trainer_password", { _id: data.id, _password: data.password });
    if (error) { console.error(error); throw new Error("RESET_FAILED"); }
    return { ok: true };
  });
