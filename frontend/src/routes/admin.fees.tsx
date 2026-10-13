import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, IndianRupee, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { CrudPage } from "@/components/admin/CrudPage";
import { opts } from "@/components/admin/field-options";
import { PageHeader, Panel, selectCls, StatCard, StatusBadge } from "@/components/admin/ui";
import { useOptions } from "@/hooks/use-options";
import { useList, useNames } from "@/hooks/use-resource";
import type { Fee, FeePlan } from "@/lib/api";
import { feeApi, paymentApi } from "@/lib/api/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/site/Button";
import { inputCls } from "@/components/site/FormField";

export const Route = createFileRoute("/admin/fees")({
  head: () => ({
    meta: [
      { title: "Fees & Payments — Athletix Admin" },
      { name: "description", content: "Fee plans, dues and payment history (demo data)." },
    ],
  }),
  component: Fees,
});

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function Fees() {
  const [paying, setPaying] = useState<Fee | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [addingFee, setAddingFee] = useState(false);
  const [creatingFee, setCreatingFee] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newFee, setNewFee] = useState({
    playerId: "",
    planId: "",
    amount: "",
    paidAmount: "0",
    paidAt: new Date().toISOString().slice(0, 10),
    dueDate: "",
    method: "Cash",
  });
  const queryClient = useQueryClient();
  const players = useOptions("players"),
    plans = useOptions("feePlans"),
    sports = useOptions("sports");
  const player = useNames("players"),
    plan = useNames("feePlans"),
    sport = useNames("sports");
  const fees = useList("fees"),
    feePlans = useList("feePlans");
  const history = useQuery({ queryKey: ["payments", "admin"], queryFn: paymentApi.adminHistory });
  const paidTotal = fees.reduce(
    (total, fee) => total + (fee.paidAmount ?? (fee.status === "Paid" ? fee.amount : 0)),
    0,
  );
  const pendingTotal = fees
    .filter((fee) => fee.status === "Pending")
    .reduce((total, fee) => total + (fee.pendingAmount ?? fee.amount), 0);
  const overdueTotal = fees
    .filter((fee) => fee.status === "Overdue")
    .reduce((total, fee) => total + (fee.pendingAmount ?? fee.amount), 0);
  const remainingAmount = Math.max(0, Number(newFee.amount || 0) - Number(newFee.paidAmount || 0));
  const paidAmountInvalid =
    Number(newFee.paidAmount) < 0 || Number(newFee.paidAmount) > Number(newFee.amount);
  const createFee = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const total = Number(newFee.amount),
      paid = Number(newFee.paidAmount);
    if (
      !Number.isFinite(total) ||
      total <= 0 ||
      !Number.isFinite(paid) ||
      paid < 0 ||
      paid > total
    ) {
      setCreateError("Enter a valid total amount and a paid amount between zero and the total.");
      return;
    }
    setCreatingFee(true);
    setCreateError("");
    try {
      await feeApi.create({
        playerId: newFee.playerId,
        planId: newFee.planId,
        amount: total,
        paidAmount: paid,
        dueDate: newFee.dueDate,
        ...(paid > 0
          ? {
              paidAt: new Date(`${newFee.paidAt}T00:00:00.000Z`).toISOString(),
              method: newFee.method,
            }
          : {}),
      });
      await queryClient.invalidateQueries({ queryKey: ["fees"] });
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
      await queryClient.invalidateQueries({ queryKey: ["portal"] });
      toast.success("Fee record added");
      setAddingFee(false);
      setNewFee({
        playerId: "",
        planId: "",
        amount: "",
        paidAmount: "0",
        paidAt: new Date().toISOString().slice(0, 10),
        dueDate: "",
        method: "Cash",
      });
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Could not add the fee record.");
    } finally {
      setCreatingFee(false);
    }
  };
  const recordPayment = async () => {
    if (!paying || saving) return;
    setSaving(true);
    setError("");
    try {
      await paymentApi.record(paying.id, {
        amount: Number(amount),
        method,
        paidAt: new Date().toISOString(),
      });
      await queryClient.invalidateQueries({ queryKey: ["fees"] });
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
      await queryClient.invalidateQueries({ queryKey: ["portal"] });
      toast.success(`Payment recorded for ${player(paying.playerId)}`);
      setPaying(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record payment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fees & payments"
        text="Record manual payments. This does not process online payments."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Collected" value={inr(paidTotal)} icon={CheckCircle2} />
        <StatCard label="Pending" value={inr(pendingTotal)} icon={Wallet} />
        <StatCard label="Overdue" value={inr(overdueTotal)} icon={IndianRupee} />
      </div>
      <CrudPage<Fee>
        embedded
        resource="fees"
        title="Player dues"
        singular="Fee record"
        searchKeys={["playerId", "method"]}
        addButton={
          <Button
            size="sm"
            onClick={() => {
              setCreateError("");
              setAddingFee(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add fee record
          </Button>
        }
        filters={[
          { name: "status", label: "Statuses", options: opts(["Paid", "Pending", "Overdue"]) },
          { name: "planId", label: "Plans", options: plans },
        ]}
        rowActions={(f) =>
          (f.pendingAmount ?? f.amount) > 0 && (
            <button
              onClick={() => {
                setPaying(f);
                setAmount(String(f.pendingAmount ?? f.amount));
                setMethod("Cash");
                setError("");
              }}
              className="rounded-md px-2 py-1.5 text-xs font-semibold hover:bg-secondary"
            >
              Add payment
            </button>
          )
        }
        columns={[
          {
            key: "playerId",
            label: "Player",
            render: (r) => <span className="font-semibold">{player(r.playerId)}</span>,
            csv: (r) => player(r.playerId),
          },
          {
            key: "planId",
            label: "Plan",
            render: (r) => plan(r.planId),
            csv: (r) => plan(r.planId),
          },
          { key: "amount", label: "Amount", render: (r) => inr(r.amount) },
          { key: "paidAmount", label: "Paid", render: (r) => inr(r.paidAmount ?? 0) },
          {
            key: "pendingAmount",
            label: "Pending",
            render: (r) => inr(r.pendingAmount ?? Math.max(0, r.amount - (r.paidAmount ?? 0))),
          },
          { key: "dueDate", label: "Due" },
          { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
        ]}
        fields={[
          { name: "playerId", label: "Player", type: "select", options: players, required: true },
          { name: "planId", label: "Fee plan", type: "select", options: plans, required: true },
          { name: "amount", label: "Amount (₹)", type: "number", required: true },
          { name: "dueDate", label: "Due date", type: "date", required: true },
        ]}
      />
      <CrudPage<FeePlan>
        embedded
        resource="feePlans"
        title="Fee structures"
        singular="Fee plan"
        searchKeys={["name"]}
        filters={[
          {
            name: "frequency",
            label: "Frequencies",
            options: opts(["Monthly", "Quarterly", "Annual"]),
          },
        ]}
        columns={[
          {
            key: "name",
            label: "Plan",
            render: (r) => <span className="font-semibold">{r.name}</span>,
          },
          {
            key: "sportId",
            label: "Sport",
            render: (r) => sport(r.sportId),
            csv: (r) => sport(r.sportId),
          },
          { key: "amount", label: "Amount", render: (r) => inr(r.amount) },
          { key: "frequency", label: "Frequency" },
        ]}
        fields={[
          { name: "name", label: "Plan name", required: true, full: true },
          { name: "sportId", label: "Sport", type: "select", options: sports, required: true },
          { name: "amount", label: "Amount (₹)", type: "number", required: true },
          {
            name: "frequency",
            label: "Frequency",
            type: "select",
            options: opts(["Monthly", "Quarterly", "Annual"]),
            required: true,
          },
        ]}
      />
      <Panel title="Payment history">
        <ul className="divide-y text-sm">
          {(history.data ?? []).map((record) => {
            const payer = record["playerId"] as { name?: string } | string;
            return (
              <li key={String(record["id"] ?? record["_id"])} className="flex justify-between py-2">
                <span>
                  {typeof payer === "object" ? payer.name : "Player"}{" "}
                  <span className="text-muted-foreground">
                    · {String(record["method"])} · {String(record["paidAt"]).slice(0, 10)}
                  </span>
                </span>
                <b>{inr(Number(record["amount"] ?? 0))}</b>
              </li>
            );
          })}
          {history.isLoading && (
            <li className="py-6 text-center text-muted-foreground">Loading payment history…</li>
          )}
          {history.isError && (
            <li role="alert" className="py-6 text-center text-destructive">
              {history.error.message}
            </li>
          )}
          {!history.isLoading && !history.isError && !history.data?.length && (
            <li className="py-6 text-center text-muted-foreground">No payments yet.</li>
          )}
        </ul>
      </Panel>
      <Dialog open={addingFee} onOpenChange={(open) => !creatingFee && setAddingFee(open)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add fee record</DialogTitle>
          </DialogHeader>
          <form onSubmit={createFee} className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              Player *
              <select
                required
                value={newFee.playerId}
                onChange={(e) => setNewFee({ ...newFee, playerId: e.target.value })}
                className={`${selectCls} mt-1 h-11 w-full`}
              >
                <option value="">Select player…</option>
                {players.map((option) => (
                  <option key={option.value} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Fee plan *
              <select
                required
                value={newFee.planId}
                onChange={(e) => {
                  const selected = feePlans.find((item) => item.id === e.target.value);
                  setNewFee({
                    ...newFee,
                    planId: e.target.value,
                    amount: selected ? String(selected.amount) : newFee.amount,
                  });
                }}
                className={`${selectCls} mt-1 h-11 w-full`}
              >
                <option value="">Select fee plan…</option>
                {plans.map((option) => (
                  <option key={option.value} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Total amount (₹) *
              <input
                required
                min="0.01"
                step="0.01"
                type="number"
                value={newFee.amount}
                onChange={(e) => setNewFee({ ...newFee, amount: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </label>
            <label className="block text-sm">
              Amount paid (₹)
              <input
                min="0"
                step="0.01"
                max={Number(newFee.amount) || undefined}
                type="number"
                value={newFee.paidAmount}
                onChange={(e) => setNewFee({ ...newFee, paidAmount: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </label>
            {paidAmountInvalid && (
              <p role="alert" className="sm:col-span-2 text-sm text-destructive">
                Amount paid cannot be greater than the total fee amount.
              </p>
            )}
            {Number(newFee.paidAmount) > 0 && (
              <>
                <label className="block text-sm">
                  Date paid *
                  <input
                    required
                    type="date"
                    value={newFee.paidAt}
                    onChange={(e) => setNewFee({ ...newFee, paidAt: e.target.value })}
                    className={`${inputCls} mt-1`}
                  />
                </label>
                <label className="block text-sm">
                  Payment method *
                  <select
                    required
                    value={newFee.method}
                    onChange={(e) => setNewFee({ ...newFee, method: e.target.value })}
                    className={`${selectCls} mt-1 h-11 w-full`}
                  >
                    {["Cash", "UPI", "Card", "Bank transfer"].map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <label className="block text-sm">
              Amount left to pay (₹)
              <input
                readOnly
                value={inr(remainingAmount)}
                className={`${inputCls} mt-1 bg-muted`}
              />
            </label>
            <label className="block text-sm">
              Due date *
              <input
                required
                type="date"
                value={newFee.dueDate}
                onChange={(e) => setNewFee({ ...newFee, dueDate: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </label>
            {createError && (
              <p role="alert" className="sm:col-span-2 text-sm text-destructive">
                {createError}
              </p>
            )}
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                disabled={creatingFee}
                onClick={() => setAddingFee(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creatingFee || paidAmountInvalid}>
                {creatingFee ? "Saving…" : "Save fee record"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!paying} onOpenChange={(open) => !open && !saving && setPaying(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record manual payment</DialogTitle>
          </DialogHeader>
          {paying && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {player(paying.playerId)} · Paid {inr(paying.paidAmount ?? 0)} · Pending{" "}
                {inr(paying.pendingAmount ?? paying.amount)}
              </p>
              <label className="block text-sm">
                Add payment amount (₹)
                <input
                  className={`${inputCls} mt-1`}
                  type="number"
                  min="0.01"
                  max={paying.pendingAmount ?? paying.amount}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                Method
                <select
                  className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  {["Cash", "UPI", "Card", "Bank transfer"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <div className="flex justify-end">
                <Button
                  disabled={
                    saving ||
                    !Number(amount) ||
                    Number(amount) <= 0 ||
                    Number(amount) > (paying.pendingAmount ?? paying.amount)
                  }
                  onClick={recordPayment}
                >
                  {saving ? "Saving…" : "Save payment record"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
