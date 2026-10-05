import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CreditCard, Edit, PauseCircle, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/external-supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApplicationForm } from "@/components/applications/application-form";
import { PaymentDialog } from "@/components/payments/payment-dialog";
import { PageHeader, Surface, EmptyState } from "@/components/app/page";
import { fmtDate, fmtMoney, friendlyError, titleCase, todayISO } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";
type App = Database["public"]["Tables"]["applications"]["Row"] & { plans: Database["public"]["Tables"]["plans"]["Row"] | null };
type Payment = Database["public"]["Tables"]["payments"]["Row"] & { plans: { name: string }; users: { name: string } };
export const Route = createFileRoute("/_authenticated/applications/$id")({ head: () => ({ meta: [{ title: "Application Details — Lift & Fit" }, { name: "description", content: "View and manage a Lift & Fit membership." }, { property: "og:title", content: "Application Details — Lift & Fit" }, { property: "og:description", content: "View and manage a Lift & Fit membership." }] }), component: Details });
function Details() {
  const { id } = Route.useParams(); const navigate = useNavigate(); const [app, setApp] = useState<App | null>(null); const [payments, setPayments] = useState<Payment[]>([]); const [edit, setEdit] = useState(false); const [pay, setPay] = useState(false); const [reactivate, setReactivate] = useState(false); const [start, setStart] = useState(todayISO()); const [planId, setPlanId] = useState(""); const [plans, setPlans] = useState<Database["public"]["Tables"]["plans"]["Row"][]>([]);
  async function load() { const [{ data }, { data: ps }] = await Promise.all([supabase.from("applications").select("*,plans(*)").eq("id", id).maybeSingle(), supabase.from("payments").select("*,plans(name),users(name)").eq("application_id", id).order("paid_date", { ascending: false })]); setApp(data as App | null); setPayments((ps ?? []) as unknown as Payment[]); }
  useEffect(() => { load(); supabase.from("plans").select("*").eq("is_active", true).then(({ data }) => { setPlans(data ?? []); if (data?.[0]) setPlanId(data[0].id); }); }, [id]);
  async function deactivate() { if (!app || !confirm("Deactivate this application? Payment history will be kept.")) return; const { error } = await supabase.rpc("deactivate_application", { _app: app.id }); if (error) toast.error(friendlyError(error)); else { toast.success("Application deactivated."); load(); } }
  async function doReactivate() { if (!app || !planId) return; const { error } = await supabase.rpc("reactivate_application", { _app: app.id, _start: start, _plan: planId }); if (error) toast.error(friendlyError(error)); else { toast.success("Application reactivated."); setReactivate(false); load(); } }
  if (!app) return <EmptyState title="Application not found." action={<Button onClick={() => navigate({ to: "/applications" })}>Back to Applications</Button>} />;
  const info = [["Age", app.age], ["Weight", app.weight ? `${app.weight} kg` : null], ["Mobile", app.mobile_number], ["WhatsApp", app.whatsapp_number], ["Workout Time", titleCase(app.workout_time)]];
  const member = [["Plan", app.plans?.name], ["Amount", fmtMoney(app.plans?.amount)], ["Application Date", fmtDate(app.application_date)], ["Fee Date", fmtDate(app.fee_date)], ["Last Paid Date", fmtDate(app.last_paid_date)]];
  return <><PageHeader title="Application Details" actions={<div className="flex gap-2"><Button variant="outline" onClick={() => setEdit(true)}><Edit />Edit</Button>{app.is_active ? <><Button variant="destructive" onClick={deactivate}><PauseCircle />Deactivate</Button><Button onClick={() => setPay(true)}><CreditCard />Payment</Button></> : <Button variant="success" onClick={() => setReactivate(true)}><PlayCircle />Reactivate</Button>}</div>} />
    <div className="mb-5 flex items-start justify-between rounded-lg border bg-card p-5 shadow-card"><div><p className="font-mono text-sm font-semibold text-primary">{app.application_id}</p><h2 className="mt-1 text-2xl font-bold">{app.applicant_name}</h2><p className="text-sm text-muted-foreground">{titleCase(app.category)}</p></div><Badge variant={app.is_active ? "active" : "inactive"}>{app.is_active ? "Active" : "Inactive"}</Badge></div>
    <div className="mb-5 grid gap-5 lg:grid-cols-2">{[["Personal Information", info], ["Membership", member]].map(([title, fields]) => <Surface key={title as string} className="p-5"><h3 className="mb-4 font-semibold">{title as string}</h3><dl className="grid grid-cols-2 gap-4">{(fields as unknown[][]).map(([k, v]) => <div key={k as string}><dt className="text-xs text-muted-foreground">{k as string}</dt><dd className="mt-1 text-sm font-medium">{v == null || v === "" ? "—" : String(v)}</dd></div>)}</dl></Surface>)}</div>
    <Surface><div className="border-b px-4 py-3"><h3 className="font-semibold">Payment History</h3></div>{payments.length === 0 ? <EmptyState title="No payment records found." /> : <Table><TableHeader><TableRow><TableHead>Paid Date</TableHead><TableHead>Plan</TableHead><TableHead>Amount</TableHead><TableHead>Paid By</TableHead></TableRow></TableHeader><TableBody>{payments.map((p) => <TableRow key={p.id}><TableCell>{fmtDate(p.paid_date)}</TableCell><TableCell>{p.plans.name}</TableCell><TableCell>{fmtMoney(p.amount)}</TableCell><TableCell>{p.users.name}</TableCell></TableRow>)}</TableBody></Table>}</Surface>
    <Dialog open={edit} onOpenChange={setEdit}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>Edit Application</DialogTitle></DialogHeader><ApplicationForm application={app} onSaved={() => { setEdit(false); load(); }} onCancel={() => setEdit(false)} /></DialogContent></Dialog>
    <Dialog open={reactivate} onOpenChange={setReactivate}><DialogContent><DialogHeader><DialogTitle>Reactivate Application</DialogTitle></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label>Fee Start Date</Label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div><div className="space-y-2"><Label>Plan</Label><Select value={planId} onValueChange={setPlanId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} — {fmtMoney(p.amount)}</SelectItem>)}</SelectContent></Select></div></div><DialogFooter><Button variant="outline" onClick={() => setReactivate(false)}>Cancel</Button><Button variant="success" onClick={doReactivate}>Reactivate</Button></DialogFooter></DialogContent></Dialog>
    <PaymentDialog application={app} open={pay} onOpenChange={setPay} onDone={load} />
  </>;
}