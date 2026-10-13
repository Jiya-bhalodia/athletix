import { Download, KeyRound, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/site/Button";
import { Field, inputCls } from "@/components/site/FormField";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useResourcePage, useMutations } from "@/hooks/use-resource";
import { useQueryClient } from "@tanstack/react-query";
import { provisionProfileLogin } from "@/lib/api/client";
import type { ApiKey } from "@/lib/api";
import { downloadCsv } from "@/lib/csv";
import { Empty, PageHeader, Panel, selectCls } from "./ui";

export type Option = { value: string; label: string; disabled?: boolean };
export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "password" | "number" | "date" | "time" | "select" | "textarea";
  options?: Option[];
  required?: boolean;
  full?: boolean;
  multiple?: boolean;
};
export type Column<T> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  csv?: (row: T) => unknown;
};
export type FilterDef = { name: string; label: string; options: Option[] };

type Props<T> = {
  resource: ApiKey;
  title: string;
  text?: string;
  singular: string;
  fields: FieldDef[];
  columns: Column<T>[];
  filters?: FilterDef[];
  searchKeys: (keyof T & string)[];
  defaults?: Partial<T>;
  rowActions?: (row: T) => React.ReactNode;
  embedded?: boolean;
  addButton?: React.ReactNode;
  loginAccounts?: boolean;
};

export function CrudPage<T extends { id: string }>(p: Props<T>) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const listQuery = useResourcePage(p.resource, { q, filters, page, limit: 25 });
  const rows = (listQuery.data?.rows ?? []) as unknown as T[];
  const { create, update, remove } = useMutations(p.resource);
  const [editing, setEditing] = useState<T | "new" | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [accountTarget, setAccountTarget] = useState<T | null>(null);
  const [accountError, setAccountError] = useState("");
  const [accountSaving, setAccountSaving] = useState(false);
  const queryClient = useQueryClient();

  const visible = rows;

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {};
    const errs: Record<string, string> = {};
    for (const f of p.fields) {
      const selected = f.multiple ? fd.getAll(f.name).map(String) : null;
      const raw = f.multiple
        ? selected!.length
          ? selected!.join(",")
          : ""
        : String(fd.get(f.name) ?? "").trim();
      if (f.required && !raw) errs[f.name] = `${f.label} is required`;
      if (f.type === "email" && raw && !/^\S+@\S+\.\S+$/.test(raw))
        errs[f.name] = "Enter a valid email";
      if (f.type === "password" && raw.length < 12) errs[f.name] = "Use at least 12 characters";
      data[f.name] = f.multiple
        ? selected
        : f.type === "number"
          ? raw === ""
            ? null
            : Number(raw)
          : raw;
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const isNew = editing === "new";
    const action = isNew
      ? create.mutateAsync(data as never)
      : update.mutateAsync({ id: (editing as T).id, data: data as never });
    action
      .then(() => {
        toast.success(`${p.singular} ${isNew ? "added" : "updated"}`);
        setEditing(null);
      })
      .catch(() => undefined);
  };

  const saveAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("loginPassword") ?? "");
    if (password.length < 12) {
      setAccountError("Use at least 12 characters.");
      return;
    }
    if (!accountTarget || (p.resource !== "players" && p.resource !== "parents")) return;
    setAccountSaving(true);
    setAccountError("");
    try {
      await provisionProfileLogin(p.resource, accountTarget.id, password);
      await queryClient.invalidateQueries({ queryKey: [p.resource] });
      toast.success(
        `${(accountTarget as T & { userId?: string }).userId ? "Password reset for" : "Login account linked for"} ${(accountTarget as T & { name?: string }).name ?? "profile"}`,
      );
      setAccountTarget(null);
    } catch (e) {
      setAccountError(e instanceof Error ? e.message : "Could not link login account");
    } finally {
      setAccountSaving(false);
    }
  };

  const current =
    editing && editing !== "new"
      ? (editing as Record<string, unknown>)
      : ((p.defaults as Record<string, unknown> | undefined) ?? {});
  const exportCsv = () =>
    downloadCsv(
      `${p.resource}.csv`,
      visible.map((r) =>
        Object.fromEntries(
          p.columns.map((c) => [c.label, c.csv ? c.csv(r) : (r as Record<string, unknown>)[c.key]]),
        ),
      ),
    );

  return (
    <div>
      {!p.embedded && (
        <PageHeader title={p.title} text={p.text}>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setErrors({});
              setEditing("new");
            }}
          >
            <Plus className="h-4 w-4" />
            Add {p.singular.toLowerCase()}
          </Button>
        </PageHeader>
      )}
      <Panel
        action={
          p.embedded
            ? (p.addButton ?? (
                <Button
                  size="sm"
                  onClick={() => {
                    setErrors({});
                    setEditing("new");
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add {p.singular.toLowerCase()}
                </Button>
              ))
            : undefined
        }
        title={p.embedded ? p.title : undefined}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder={`Search ${p.title.toLowerCase()}…`}
              aria-label="Search"
              className={`${inputCls} h-10 pl-9`}
            />
          </div>
          {p.filters?.map((f) => (
            <select
              key={f.name}
              aria-label={f.label}
              className={selectCls}
              value={filters[f.name] ?? ""}
              onChange={(e) => {
                setFilters({ ...filters, [f.name]: e.target.value });
                setPage(1);
              }}
            >
              <option value="">All {f.label.toLowerCase()}</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value} disabled={o.disabled}>
                  {o.label}
                </option>
              ))}
            </select>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                {p.columns.map((c) => (
                  <th key={c.key} className="whitespace-nowrap px-3 py-2 font-semibold">
                    {c.label}
                  </th>
                ))}
                <th className="px-3 py-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-muted">
                  {p.columns.map((c) => (
                    <td key={c.key} className="whitespace-nowrap px-3 py-2.5">
                      {c.render
                        ? c.render(r)
                        : String((r as Record<string, unknown>)[c.key] ?? "—")}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-1">
                      {p.rowActions?.(r)}
                      {p.loginAccounts && (
                        <button
                          onClick={() => {
                            setAccountError("");
                            setAccountTarget(r);
                          }}
                          className="rounded-md p-2 hover:bg-secondary"
                          aria-label={
                            (r as T & { userId?: string }).userId
                              ? "Reset login password"
                              : "Create login account"
                          }
                          title={
                            (r as T & { userId?: string }).userId
                              ? "Reset login password"
                              : "Create login account"
                          }
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setErrors({});
                          setEditing(r);
                        }}
                        className="rounded-md p-2 hover:bg-secondary"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleting(r)}
                        className="rounded-md p-2 text-destructive hover:bg-secondary"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!listQuery.isLoading && !listQuery.isError && !visible.length && <Empty />}
          {listQuery.isLoading && (
            <tr>
              <td
                colSpan={p.columns.length + 1}
                className="p-6 text-center text-sm text-muted-foreground"
              >
                Loading {p.title.toLowerCase()}…
              </td>
            </tr>
          )}
          {listQuery.isError && (
            <tr>
              <td
                colSpan={p.columns.length + 1}
                className="p-6 text-center text-sm text-destructive"
              >
                {listQuery.error.message}{" "}
                <button className="underline" onClick={() => void listQuery.refetch()}>
                  Retry
                </button>
              </td>
            </tr>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {listQuery.data?.pagination
              ? `${listQuery.data.pagination.total} records · page ${page} of ${Math.max(listQuery.data.pagination.pages, 1)}`
              : `${visible.length} records`}
          </span>
          {listQuery.data?.pagination && listQuery.data.pagination.pages > 1 && (
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((n) => n - 1)}
                className="rounded border px-2 py-1 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= listQuery.data.pagination.pages}
                onClick={() => setPage((n) => n + 1)}
                className="rounded border px-2 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </Panel>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editing === "new"
                ? `Add ${p.singular.toLowerCase()}`
                : `Edit ${p.singular.toLowerCase()}`}
            </DialogTitle>
          </DialogHeader>
          <form
            key={editing === "new" ? "new" : (editing as T | null)?.id}
            onSubmit={submit}
            noValidate
            className="grid gap-4 sm:grid-cols-2"
          >
            {p.fields.map((f) => {
              if (f.type === "password" && editing !== "new") return null;
              const v = current[f.name];
              const dv = v === null || v === undefined ? "" : String(v);
              return (
                <div
                  key={f.name}
                  className={f.full || f.type === "textarea" ? "sm:col-span-2" : ""}
                >
                  <Field
                    label={f.label + (f.required ? " *" : "")}
                    htmlFor={`f-${f.name}`}
                    error={errors[f.name]}
                  >
                    {f.type === "select" ? (
                      <select
                        id={`f-${f.name}`}
                        name={f.name}
                        multiple={f.multiple}
                        defaultValue={f.multiple ? (Array.isArray(v) ? v.map(String) : []) : dv}
                        className={`${selectCls} ${f.multiple ? "min-h-28" : "h-11"} w-full`}
                      >
                        {!f.multiple && <option value="">Select…</option>}
                        {f.options?.map((o) => (
                          <option key={o.value} value={o.value} disabled={o.disabled}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : f.type === "textarea" ? (
                      <textarea
                        id={`f-${f.name}`}
                        name={f.name}
                        defaultValue={dv}
                        rows={3}
                        className={`${inputCls} h-auto py-2`}
                      />
                    ) : (
                      <input
                        id={`f-${f.name}`}
                        name={f.name}
                        type={f.type ?? "text"}
                        defaultValue={dv}
                        className={inputCls}
                      />
                    )}
                  </Field>
                </div>
              );
            })}
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending || update.isPending}>
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!accountTarget} onOpenChange={(open) => !open && setAccountTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {(accountTarget as (T & { userId?: string }) | null)?.userId
                ? "Reset login password"
                : "Create login"}{" "}
              for {(accountTarget as (T & { name?: string }) | null)?.name ?? "profile"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            The login email is the email on this profile. Set a new password of at least 12
            characters and share it securely.
          </p>
          <form onSubmit={saveAccount} className="grid gap-4">
            <Field label="Temporary password" htmlFor="login-password" error={accountError}>
              <input
                id="login-password"
                name="loginPassword"
                type="password"
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                required
                className={inputCls}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAccountTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={accountSaving}>
                {accountSaving
                  ? "Saving…"
                  : (accountTarget as (T & { userId?: string }) | null)?.userId
                    ? "Reset password"
                    : "Create login"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {p.singular.toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the record from the academy database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleting &&
                remove
                  .mutateAsync(deleting.id)
                  .then(() => {
                    toast.success(`${p.singular} deleted`);
                    setDeleting(null);
                  })
                  .catch(() => undefined)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
