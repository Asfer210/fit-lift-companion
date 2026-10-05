import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-2xl font-bold">{title}</h1>{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}</div>
      {actions}
    </div>
  );
}

export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></div>;
}

export function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`overflow-hidden rounded-lg border bg-card shadow-card ${className}`}>{children}</section>;
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center justify-center px-4 py-14 text-center"><p className="font-semibold">{title}</p>{body && <p className="mt-1 text-sm text-muted-foreground">{body}</p>}{action && <div className="mt-4">{action}</div>}</div>;
}