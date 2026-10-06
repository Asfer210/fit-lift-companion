import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/external-supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtMoney, friendlyError, normalizePhone, todayISO } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";

type App = Database["public"]["Tables"]["applications"]["Row"];
type Plan = Database["public"]["Tables"]["plans"]["Row"];
export type ApplicationValues = { appNo: string; name: string; age: string; weight: string; mobile: string; whatsapp: string; category: string; workout: string; applicationDate: string; planId: string };
const empty: ApplicationValues = { appNo: "", name: "", age: "", weight: "", mobile: "", whatsapp: "", category: "", workout: "", applicationDate: todayISO(), planId: "" };

export function ApplicationForm({ application, onSaved, onCancel }: { application?: App; onSaved: (id: string) => void; onCancel: () => void }) {
  const [v, setV] = useState<ApplicationValues>(application ? { appNo: application.application_id, name: application.applicant_name, age: String(application.age ?? ""), weight: String(application.weight ?? ""), mobile: application.mobile_number ?? "", whatsapp: application.whatsapp_number ?? "", category: application.category, workout: application.workout_time ?? "", applicationDate: application.application_date, planId: application.plan_id ?? "" } : empty);
  const [plans, setPlans] = useState<Plan[]>([]); const [busy, setBusy] = useState(false); const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => { void supabase.from("plans").select("*").eq("is_active", true).then(({ data }) => { setPlans(data ?? []); const firstPlan = data?.[0]; if (!application && firstPlan) setV((x) => ({ ...x, planId: firstPlan.id })); }); }, [application]);
  const set = (k: keyof ApplicationValues, value: string) => setV((x) => ({ ...x, [k]: value }));
  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault(); const next: Record<string, string> = {};
    const appNo = v.appNo.trim().toUpperCase();
    if (!appNo) next["appNo"] = "Application Number is required."; else if (!/^[A-Z0-9-]{1,30}$/.test(appNo)) next["appNo"] = "Use letters, numbers and dashes only (max 30).";
    if (!v.name.trim()) next["name"] = "Applicant Name is required."; if (!v.category) next["category"] = "Category is required."; if (!v.applicationDate) next["applicationDate"] = "Application Date is required."; if (!application && !v.planId) next["planId"] = "Plan is required.";
    if (v.age && (!Number.isInteger(Number(v.age)) || Number(v.age) <= 0)) next["age"] = "Enter a positive whole number.";
    if (v.weight && Number(v.weight) <= 0) next["weight"] = "Enter a positive number.";
    const mobile = v.mobile ? normalizePhone(v.mobile) : null; const whatsapp = v.whatsapp ? normalizePhone(v.whatsapp) : null;
    if (v.mobile && !mobile) next["mobile"] = "Enter a valid phone number."; if (v.whatsapp && !whatsapp) next["whatsapp"] = "Enter a valid phone number.";
    setErrors(next); if (Object.keys(next).length) return; setBusy(true);
    const dup = await supabase.from("applications").select("id").eq("application_id", appNo).maybeSingle();
    if (dup.data && dup.data.id !== application?.id) { setBusy(false); setErrors({ appNo: "This Application Number already exists." }); return; }
    const args = { _name: v.name.trim(), _age: v.age ? Number(v.age) : 0, _weight: v.weight ? Number(v.weight) : 0, _mobile: mobile ?? "", _whatsapp: whatsapp ?? "", _category: v.category, _workout: v.workout || "DAY" };
    const result = application ? await supabase.rpc("update_application", { ...args, _id: application.id }) : await supabase.rpc("create_application", { ...args, _app_date: v.applicationDate, _plan: v.planId });
    if (result.error) { setBusy(false); toast.error(friendlyError(result.error, "Unable to save application. Please try again.")); return; }
    const savedId = application?.id ?? (result.data as App).id;
    if (appNo !== (application?.application_id ?? (result.data as App).application_id)) {
      const up = await supabase.from("applications").update({ application_id: appNo }).eq("id", savedId).select("id");
      if (up.error || !up.data?.length) { setBusy(false); toast.error(up.error?.message.includes("duplicate") ? "This Application Number already exists." : "Saved, but the Application Number could not be set."); onSaved(savedId); return; }
    }
    setBusy(false); toast.success(application ? "Application updated." : "Application created."); onSaved(savedId);
  }
  const field = (name: keyof ApplicationValues, label: string, type = "text") => <div className="space-y-2"><Label htmlFor={name}>{label}</Label><Input id={name} type={type} value={v[name]} onChange={(e) => set(name, e.target.value)} />{errors[name] && <p className="text-xs text-destructive">{errors[name]}</p>}</div>;
  return <form onSubmit={submit} className="space-y-5"><div className="grid gap-4 md:grid-cols-2">{field("appNo", "Application Number *")}{field("name", "Applicant Name *")}{field("age", "Age", "number")}{field("weight", "Weight (kg)", "number")}{field("mobile", "Mobile Number")}{field("whatsapp", "WhatsApp Number")}
    <div className="space-y-2"><Label>Category *</Label><Select value={v.category} onValueChange={(x) => set("category", x)}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent><SelectItem value="MALE">Male</SelectItem><SelectItem value="FEMALE">Female</SelectItem></SelectContent></Select>{errors["category"] && <p className="text-xs text-destructive">{errors["category"]}</p>}</div>
    <div className="space-y-2"><Label>Workout Time</Label><Select value={v.workout} onValueChange={(x) => set("workout", x)}><SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger><SelectContent><SelectItem value="DAY">Day</SelectItem><SelectItem value="EVENING">Evening</SelectItem></SelectContent></Select></div>
    {!application && <><div className="space-y-2"><Label>Application Date *</Label><Input type="date" value={v.applicationDate} onChange={(e) => set("applicationDate", e.target.value)} />{errors["applicationDate"] && <p className="text-xs text-destructive">{errors["applicationDate"]}</p>}</div><div className="space-y-2"><Label>Plan *</Label><Select value={v.planId} onValueChange={(x) => set("planId", x)}><SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger><SelectContent>{plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} — {fmtMoney(p.amount)}</SelectItem>)}</SelectContent></Select>{errors["planId"] && <p className="text-xs text-destructive">{errors["planId"]}</p>}</div></>}
  </div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" />}{busy ? "Saving..." : application ? "Save Changes" : "Save Application"}</Button></div></form>;
}