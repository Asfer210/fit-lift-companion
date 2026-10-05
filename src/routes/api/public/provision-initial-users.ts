import { createFileRoute } from "@tanstack/react-router";

// One-time, idempotent provisioning of the initial Developer and Admin accounts.
// Passwords come only from server secrets. If an account already exists it is left untouched.
const INITIAL = [
  { name: "Jack", username: "+917994037112", role: "DEVELOPER", secret: "INITIAL_DEVELOPER_PASSWORD" },
  { name: "Abdulla", username: "+919645804640", role: "ADMIN", secret: "INITIAL_ADMIN_PASSWORD" },
] as const;

export const Route = createFileRoute("/api/public/provision-initial-users")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/lib/external-supabase.server");
        const { count } = await supabaseAdmin.from("users").select("id", { count: "exact", head: true });
        if ((count ?? 0) > 0) return new Response("Provisioning is locked", { status: 409 });
        const results: Record<string, string> = {};
        for (const u of INITIAL) {
          const { data: existingRole } = await supabaseAdmin.from("users").select("id").eq("role", u.role).limit(1);
          if (existingRole && existingRole.length) { results[u.role] = "exists"; continue; }
          const password = process.env[u.secret];
          if (!password) { results[u.role] = "missing_password"; continue; }
          const email = `${u.username.replace(/^\+/, "")}@liftfit.staff`;
          let id: string | undefined;
          const { data: created, error } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true });
          if (error) {
            const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
            id = list?.users.find((x) => x.email === email)?.id;
            if (!id) { results[u.role] = "auth_error"; continue; }
          } else id = created.user?.id;
          if (!id) { results[u.role] = "auth_error"; continue; }
          const { error: insErr } = await supabaseAdmin.from("users").insert({
            id, username: u.username, name: u.name, role: u.role, trainer_category: null, is_active: true,
          });
          results[u.role] = insErr ? "insert_error" : "created";
        }
        return Response.json(results);
      },
    },
  },
});
