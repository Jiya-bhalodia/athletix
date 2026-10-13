import { cn } from "@/lib/utils";

export const inputCls =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-foreground focus:ring-2 focus:ring-primary";

export function Field({
  label,
  error,
  htmlFor,
  children,
}: {
  label: string;
  error?: string | undefined;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p className={cn("mt-1 text-xs text-destructive")} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
