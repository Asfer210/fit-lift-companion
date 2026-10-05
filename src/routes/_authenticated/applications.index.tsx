import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/external-supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, SearchField, Surface, EmptyState } from "@/components/app/page";
import { fmtDate, titleCase } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";

type App = Database["public"]["Tables"]["applications"]["Row"] & { plans: { name: string } | null };
export const Route = createFileRoute("/_authenticated/applications/")({ head: () => ({ meta: [{ title: "Applications — Lift & Fit" }, { name: "description", content: "Manage Lift & Fit membership applications." }, { property: "og:title", content: "Applications — Lift & Fit" }, { property: "og:description", content: "Manage Lift & Fit membership applications." }] }), component: Applications });
function Applications() {
  const [rows, setRows] = useState<App[]>([]); const [q, setQ] = useState(""); const [tab, setTab] = useState("all"); const [loading, setLoading] = useState(true);
  useEffect(() => { supabase.from("applications").select("*,plans(name)").order("created_at", { ascending: false }).then(({ data }) => { setRows((data ?? []) as App[]); setLoading(false); }); }, []);
  const filtered = useMemo(() => rows.filter((a) => (tab === "all" || (tab === "active") === a.is_active) && `${a.application_id} ${a.applicant_name}`.toLowerCase().includes(q.toLowerCase())), [rows, q, tab]);
  return <><PageHeader title="Applications" description="Manage member records and membership status." actions={<Button asChild><Link to="/applications/new"><Plus />New Application</Link></Button>} />
    <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]"><SearchField value={q} onChange={setQ} placeholder="Search Application ID or Member Name..." /><Tabs value={tab} onValueChange={setTab}><TabsList><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="active">Active</TabsTrigger><TabsTrigger value="inactive">Inactive</TabsTrigger></TabsList></Tabs></div>
    <Surface>{!loading && filtered.length === 0 ? <EmptyState title="No applications found." body="Create your first application to get started." action={<Button asChild><Link to="/applications/new"><Plus />New Application</Link></Button>} /> : <Table><TableHeader><TableRow><TableHead>Application ID</TableHead><TableHead>Member</TableHead><TableHead>Gender</TableHead><TableHead>Plan</TableHead><TableHead>Fee Date</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{filtered.map((a) => <TableRow key={a.id}><TableCell className="font-medium">{a.application_id}</TableCell><TableCell>{a.applicant_name}</TableCell><TableCell>{titleCase(a.category)}</TableCell><TableCell>{a.plans?.name ?? "—"}</TableCell><TableCell>{fmtDate(a.fee_date)}</TableCell><TableCell><Badge variant={a.is_active ? "active" : "inactive"}>{a.is_active ? "Active" : "Inactive"}</Badge></TableCell><TableCell><Button size="sm" variant="outline" asChild><Link to="/applications/$id" params={{ id: a.id }}>View</Link></Button></TableCell></TableRow>)}</TableBody></Table>}</Surface></>;
}