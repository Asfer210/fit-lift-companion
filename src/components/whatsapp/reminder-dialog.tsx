import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/external-supabase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtLongDate, friendlyError } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";

type App = Database["public"]["Tables"]["applications"]["Row"];
export function ReminderDialog({ application, open, onOpenChange, onDone }: { application: App | null; open: boolean; onOpenChange: (o: boolean) => void; onDone: () => void }) {
  const [opened, setOpened] = useState(false);
  if (!application) return null;
  const currentApplication = application;
  const message = `Lift & Fit\n\nHello ${currentApplication.applicant_name},\n\nYour gym membership payment is due on ${fmtLongDate(currentApplication.fee_date)}.\n\nPlease make the payment at your convenience.\n\nThank you!\n\n— Lift & Fit`;
  const phone = (currentApplication.whatsapp_number || currentApplication.mobile_number || "").replace(/\D/g, "");
  function launch() { window.open(`https://wa.me/${encodeURIComponent(phone)}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer"); setOpened(true); }
  async function confirm() { const { error } = await supabase.rpc("mark_reminder_sent", { _app: currentApplication.id }); if (error) { toast.error(friendlyError(error)); return; } toast.success("Reminder marked as sent."); onDone(); onOpenChange(false); setOpened(false); }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Send Payment Reminder</DialogTitle><DialogDescription>{currentApplication.applicant_name} · {currentApplication.application_id}</DialogDescription></DialogHeader><div className="rounded-md bg-muted p-4 text-sm whitespace-pre-line">{message}</div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>{opened ? <Button variant="success" onClick={confirm}>I sent the reminder</Button> : <Button variant="success" onClick={launch} disabled={!phone}><MessageCircle />Open WhatsApp</Button>}</DialogFooter></DialogContent></Dialog>;
}
