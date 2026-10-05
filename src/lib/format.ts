import { format, parseISO, differenceInCalendarDays } from "date-fns";

export const fmtDate = (d?: string | null) => (d ? format(parseISO(d), "dd-MMM-yyyy") : "—");
export const fmtLongDate = (d?: string | null) => (d ? format(parseISO(d), "dd MMMM yyyy") : "—");
export const todayISO = () => format(new Date(), "yyyy-MM-dd");
export const fmtMoney = (n?: number | string | null) =>
  n == null ? "—" : "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
export const dueDays = (d: string) => differenceInCalendarDays(new Date(), parseISO(d));

/** Normalize an Indian/intl phone number to +<digits>. Returns null if unreasonable. */
export function normalizePhone(raw: string): string | null {
  const s = raw.replace(/[\s\-()]/g, "");
  if (!s) return null;
  let digits = s.replace(/^\+/, "");
  if (!/^\d+$/.test(digits)) return null;
  if (digits.length === 10) digits = "91" + digits;
  if (digits.length < 10 || digits.length > 15) return null;
  return "+" + digits;
}

/** Synthetic login email derived from the normalized phone number. */
export const phoneToEmail = (phone: string) => `${phone.replace(/^\+/, "")}@liftfit.staff`;

export const titleCase = (s?: string | null) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : "—");

/** Map backend errors to friendly messages; log raw details for developers. */
export function friendlyError(err: unknown, fallback = "Something went wrong. Please try again."): string {
  console.error(err);
  const msg = (err as { message?: string })?.message ?? String(err);
  if (msg.includes("NOT_AUTHORIZED") || msg.includes("permission")) return "You do not have permission to perform this action.";
  if (msg.includes("INVALID_PLAN")) return "Please select an active plan.";
  if (msg.includes("APPLICATION_INACTIVE")) return "This application is inactive. Reactivate it first.";
  if (msg.includes("TRAINER_EXISTS")) return "Trainer already exists.";
  if (msg.includes("duplicate key")) return "This record already exists.";
  return fallback;
}
