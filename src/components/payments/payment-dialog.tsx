import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/external-supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtDate, fmtMoney, friendlyError, todayISO } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";

type Plan = Database["public"]["Tables"]["plans"]["Row"];
type App = Database["public"]["Tables"]["applications"]["Row"];

export function PaymentDialog({ application, open, onOpenChange, onDone }: { application: App | null; open: boolean; onOpenChange: (o: boolean) => void; onDone: () => void }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planId, setPlanId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<{ old_fee_date: string; new_fee_date: string; amount: number } | null>(null);
  useEffect(() => { if (!open) return; void supabase.from("plans").select("*").eq("is_active", true).then(({ data }) => { setPlans(data ?? []); const firstPlan = data?.[0]; if (firstPlan) setPlanId(firstPlan.id); }); }, [open]);
  const plan = plans.find((p) => p.id === planId);

  async function submit(): Promise<void> {
    if (!application || !plan) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("record_payment", { _app: application.id, _plan: plan.id, _paid_date: date, _amount: plan.amount });
    setBusy(false);
    if (error) { toast.error(friendlyError(error, "Payment could not be completed. No changes were made.")); return; }
    setSuccess(data as unknown as { old_fee_date: string; new_fee_date: string; amount: number });
    onDone();
  }

  function close() { setSuccess(null); onOpenChange(false); }
  return <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}><DialogContent className="max-w-md">
    {success ? <div className="space-y-5 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-success" /><DialogTitle>Payment Recorded Successfully</DialogTitle>
      <div className="grid grid-cols-3 gap-3 rounded-md bg-success-soft p-4 text-sm"><div><span className="text-muted-foreground">Old Fee Date</span><b className="block">{fmtDate(success.old_fee_date)}</b></div><div><span className="text-muted-foreground">New Fee Date</span><b className="block">{fmtDate(success.new_fee_date)}</b></div><div><span className="text-muted-foreground">Amount Paid</span><b className="block">{fmtMoney(success.amount)}</b></div></div>
      <Button className="w-full" onClick={close}>OK</Button>
    </div> : <>
      <DialogHeader><DialogTitle>Record Payment</DialogTitle><DialogDescription>Advance the existing membership schedule.</DialogDescription></DialogHeader>
      <div className="grid grid-cols-2 gap-4 text-sm"><div><span className="text-muted-foreground">Application ID</span><b className="block">{application?.application_id}</b></div><div><span className="text-muted-foreground">Member</span><b className="block">{application?.applicant_name}</b></div><div><span className="text-muted-foreground">Current Due</span><b className="block">{fmtDate(application?.fee_date)}</b></div><div><span className="text-muted-foreground">Amount</span><b className="block">{fmtMoney(plan?.amount)}</b></div></div>
      <div className="space-y-2"><Label>Select Plan</Label><Select value={planId} onValueChange={setPlanId}><SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger><SelectContent>{plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} — {fmtMoney(p.amount)}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label>Payment Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
      <DialogFooter><Button variant="outline" onClick={close}>Cancel</Button><Button onClick={submit} disabled={busy || !plan}>{busy && <Loader2 className="animate-spin" />}{busy ? "Processing..." : "Confirm Payment"}</Button></DialogFooter>
    </>}
  </DialogContent></Dialog>;
}