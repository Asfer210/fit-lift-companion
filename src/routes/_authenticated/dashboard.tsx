import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, CalendarClock, AlertCircle, MessageCircle, CreditCard } from "lucide-react";
import { supabase } from "@/lib/external-supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, Surface, EmptyState } from "@/components/app/page";
import { PaymentDialog } from "@/components/payments/payment-dialog";
import { ReminderDialog } from "@/components/whatsapp/reminder-dialog";
import { dueDays, fmtDate, titleCase, todayISO } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";

type App = Database["public"]["Tables"]["applications"]["Row"];
type Due = Database["public"]["Tables"]["current_due"]["Row"] & { applications: App };

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Lift & Fit" }, { name: "description", content: "Membership dues dashboard for Lift & Fit staff." }, { property: "og:title", content: "Dashboard — Lift & Fit" }, { property: "og:description", content: "Membership dues dashboard for Lift & Fit staff." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { profile } = Route.useRouteContext();
  const [dues, setDues] = useState<Due[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [selected, setSelected] = useState<App | null>(null);
  const [modal, setModal] = useState<"pay" | "remind" | null>(null);
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    const [{ data }, { count }] = await Promise.all([
      supabase.from("current_due").select("*,applications!inner(*)").lte("due_date", todayISO()).order("due_date"),
      supabase.from("applications").select("id", { count: "exact", head: true }).eq("is_active", true),
    ]);
    setDues((data ?? []) as unknown as Due[]); setActiveCount(count ?? 0); setLoading(false);
  }
  useEffect(() => { load(); }, []);
  const today = dues.filter((d) => dueDays(d.due_date) === 0).length;
  const overdue = dues.filter((d) => dueDays(d.due_date) > 0).length;
  const context = profile.role === "TRAINER" ? `My Applications — ${profile.trainer_category === "COMMON" ? "All Sections" : titleCase(profile.trainer_category)}` : undefined;
  const isAdmin = profile.role === "ADMIN";
  const cards = [{ label: context || "Active Members", value: activeCount, icon: Users, tone: "bg-success-soft text-success" }, { label: "Due Today", value: today, icon: CalendarClock, tone: "bg-warning-soft text-warning" }, { label: "Overdue", value: overdue, icon: AlertCircle, tone: "bg-danger-soft text-destructive" }];
  return <><PageHeader title={`Good morning, ${profile.name}`} description={new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date())} />
    <div className="mb-6 grid gap-4 sm:grid-cols-3">{cards.map((c) => <div key={c.label} className="rounded-lg border bg-card p-5 shadow-card"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{c.label}</p><p className="mt-1 text-3xl font-bold">{loading ? "—" : c.value}</p></div><div className={`rounded-md p-3 ${c.tone}`}><c.icon className="h-5 w-5" /></div></div></div>)}</div>
    <Surface><div className="border-b px-4 py-3"><h2 className="font-semibold">Current Dues</h2></div>{!loading && dues.length === 0 ? <EmptyState title="No current dues 🎉" body="All active memberships are up to date." /> : <Table><TableHeader><TableRow><TableHead>Application ID</TableHead><TableHead>Member</TableHead><TableHead>Due Date</TableHead><TableHead>Due Days</TableHead><TableHead>Reminder Count</TableHead>{isAdmin && <TableHead>WhatsApp</TableHead>}<TableHead>Payment</TableHead></TableRow></TableHeader><TableBody>{dues.map((d) => { const days = dueDays(d.due_date); return <TableRow key={d.id}><TableCell className="font-medium">{d.applications.application_id}</TableCell><TableCell>{d.applications.applicant_name}</TableCell><TableCell>{fmtDate(d.due_date)}</TableCell><TableCell>{days === 0 ? <Badge variant="due">Due Today</Badge> : <Badge variant="overdue">{days} days overdue</Badge>}</TableCell><TableCell>{d.reminder_sent_count}</TableCell>{isAdmin && <TableCell><Button size="sm" variant="success" onClick={() => { setSelected(d.applications); setModal("remind"); }}><MessageCircle />WhatsApp</Button></TableCell>}<TableCell><Button size="sm" onClick={() => { setSelected(d.applications); setModal("pay"); }}><CreditCard />Payment</Button></TableCell></TableRow>; })}</TableBody></Table>}</Surface>
    <PaymentDialog application={selected} open={modal === "pay"} onOpenChange={(o) => !o && setModal(null)} onDone={load} />
    {isAdmin && <ReminderDialog application={selected} open={modal === "remind"} onOpenChange={(o) => !o && setModal(null)} onDone={load} />}
  </>;
}