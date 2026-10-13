import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { PageHeader, Panel } from "@/components/admin/ui";
import { useSession } from "@/components/portal/session-context";
import { ProfileSummary, ReadOnlyNote, WithPlayer } from "@/components/portal/views";
import { fmt } from "@/components/portal/view-formatters";
import { Button } from "@/components/site/Button";
import { Field, inputCls } from "@/components/site/FormField";
import type { PlayerView } from "@/lib/api/portal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portalService } from "@/lib/api/portal";

export const Route = createFileRoute("/player/profile")({ component: Page });

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9 +-]{8,15}$/, "Enter a valid phone number"),
  emergencyName: z.string().trim().min(2, "Enter a contact name").max(80),
  emergencyPhone: z
    .string()
    .trim()
    .regex(/^[0-9 +-]{8,15}$/, "Enter a valid phone number"),
});
type Key = keyof z.infer<typeof schema>;
const editable: [Key, string][] = [
  ["email", "Email"],
  ["phone", "Phone"],
  ["emergencyName", "Emergency contact"],
  ["emergencyPhone", "Emergency phone"],
];

function Page() {
  const s = useSession();
  return (
    <>
      <PageHeader title="My profile" text="Your personal and sports details." />
      <WithPlayer playerId={s.linkedId}>{(v) => <ProfileForm v={v} />}</WithPlayer>
    </>
  );
}

function ProfileForm({ v }: { v: NonNullable<PlayerView> }) {
  const qc = useQueryClient();
  const update = useMutation({
    mutationFn: portalService.updatePlayerProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal"] }),
    onError: (e) => toast.error(e.message),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = schema.safeParse(Object.fromEntries(editable.map(([k]) => [k, fd.get(k)])));
    if (!r.success) {
      setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrors({});
    // Only whitelisted, non-sensitive fields are sent.
    update.mutate(r.data, { onSuccess: () => toast.success("Profile updated") });
  };
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4">
        <ProfileSummary v={v} />
        <Panel title="Assigned by the academy">
          <ReadOnlyNote text="Sport, team, coach and joining date are managed by coaches." />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Coach contact</dt>
              <dd>{v.coach?.phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Joined</dt>
              <dd>{fmt(v.player.joinDate)}</dd>
            </div>
          </dl>
        </Panel>
      </div>
      <Panel title="Contact details" className="lg:col-span-2">
        <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
          {editable.map(([k, label]) => (
            <Field key={k} label={label} htmlFor={k} error={errors[k]}>
              <input
                id={k}
                name={k}
                defaultValue={v.player[k]}
                className={inputCls}
                aria-invalid={!!errors[k]}
              />
            </Field>
          ))}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
