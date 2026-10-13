import { cn } from "@/lib/utils";

export const selectCls =
  "h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-foreground focus:ring-2 focus:ring-primary";

export function PageHeader({
  title,
  text,
  children,
}: {
  title: string;
  text?: string | undefined;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {text && <p className="mt-1 text-sm text-muted-foreground">{text}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Panel({
  title,
  children,
  className,
  action,
}: {
  title?: string | undefined;
  children: React.ReactNode;
  className?: string | undefined;
  action?: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-lg border bg-card p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        <span className="grid h-8 w-8 place-items-center rounded-md bg-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight">{value}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const tones: Record<string, string> = {
  good: "bg-primary text-primary-foreground",
  warn: "bg-secondary text-secondary-foreground",
  bad: "bg-destructive text-destructive-foreground",
  neutral: "border text-muted-foreground",
};
const toneOf: Record<string, keyof typeof tones> = {
  Active: "good",
  Paid: "good",
  Present: "good",
  Completed: "good",
  Yes: "good",
  Won: "good",
  Pending: "warn",
  Upcoming: "warn",
  "On leave": "warn",
  Draw: "warn",
  Overdue: "bad",
  Absent: "bad",
  Lost: "bad",
  Inactive: "neutral",
  No: "neutral",
};
export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
        tones[toneOf[value] ?? "neutral"],
      )}
    >
      {value}
    </span>
  );
}

export function Empty({ text = "No records match your filters." }: { text?: string }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{text}</p>;
}
