import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/lib/external-supabase";
import { resetTrainerPassword } from "@/lib/staff.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, Surface } from "@/components/app/page";
import { friendlyError } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";
type User = Database["public"]["Tables"]["users"]["Row"];
export const Route = createFileRoute("/_authenticated/reset-password")({ head: () => ({ meta: [{ title: "Reset Password — Lift & Fit" }, { name: "description", content: "Reset a Lift & Fit trainer password." }, { property: "og:title", content: "Reset Password — Lift & Fit" }, { property: "og:description", content: "Reset a Lift & Fit trainer password." }] }), component: Reset });
function Reset() { const [users, setUsers] = useState<User[]>([]); const [id, setId] = useState(""); const [password, setPassword] = useState(""); const reset = useServerFn(resetTrainerPassword); useEffect(() => { supabase.from("users").select("*").eq("role", "TRAINER").eq("is_active", true).order("name").then(({ data }) => setUsers(data ?? [])); }, []); async function submit(e: React.FormEvent) { e.preventDefault(); try { await reset({ data: { id, password } }); toast.success("Trainer password reset successfully."); setPassword(""); } catch (e) { toast.error(friendlyError(e)); } } return <><PageHeader title="Reset Password" description="Set a new password for an active trainer account." /><Surface className="max-w-xl p-5"><form onSubmit={submit} className="space-y-5"><div className="space-y-2"><Label>Trainer</Label><Select value={id} onValueChange={setId}><SelectTrigger><SelectValue placeholder="Select trainer" /></SelectTrigger><SelectContent>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name} · {u.username}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>New Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} /><p className="text-xs text-muted-foreground">Use at least 8 characters.</p></div><Button type="submit" disabled={!id || password.length < 8}>Reset Password</Button></form></Surface></>; }