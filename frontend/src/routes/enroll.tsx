import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/site/Button";
import { Field, inputCls } from "@/components/site/FormField";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api/client";

export const Route = createFileRoute("/enroll")({
  head: () => ({
    meta: [
      { title: "Enrollment Inquiry — Athletix" },
      {
        name: "description",
        content: "Request enrollment information for Athletix sports academy.",
      },
      { property: "og:title", content: "Enrollment Inquiry — Athletix" },
      {
        property: "og:description",
        content: "Request enrollment information for Athletix sports academy.",
      },
    ],
  }),
  component: Enroll,
});

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d\s-]{7,15}$/, "Enter a valid phone number"),
  sport: z.string().min(1, "Choose a sport"),
  message: z.string().trim().max(1000, "Keep it under 1000 characters").optional(),
});

function Enroll() {
  const sportsQuery = useQuery({ queryKey: ["public", "sports"], queryFn: publicApi.sports });
  const sports = (sportsQuery.data ?? []) as { id: string; name: string }[];
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const r = schema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!r.success) {
      setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrors({});
    setRequestError(null);
    setPending(true);
    try {
      const selected = sports.find((sport) => sport.id === r.data.sport);
      if (!selected) {
        setErrors({ sport: "Choose an available sport." });
        return;
      }
      await publicApi.enrollment({
        ...r.data,
        message: r.data.message ?? "",
        sport: selected.name,
      });
      setDone(r.data.name);
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "Your inquiry could not be sent. Please try again.",
      );
    } finally {
      setPending(false);
    }
  };

  if (done)
    return (
      <section className="container-site grid min-h-[70vh] place-items-center py-16 text-center">
        <div className="max-w-md">
          <CheckCircle2 className="mx-auto h-10 w-10 text-highlight" />
          <h1 className="mt-4 text-2xl font-bold">Thanks, {done}!</h1>
          <p className="mt-2 text-muted-foreground">
            Your inquiry was sent to the academy team. They will contact you with next steps.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => setDone(null)}>
              New inquiry
            </Button>
            <Link
              to="/"
              className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold"
            >
              Back home
            </Link>
          </div>
        </div>
      </section>
    );

  return (
    <section className="container-site py-16">
      <div className="mx-auto max-w-xl">
        <p className="eyebrow">Enrollment inquiry</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Join Athletix</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tell us a little about the player and we'll share batch timings and next steps.
        </p>
        <form onSubmit={submit} noValidate className="mt-8 grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="name" error={errors["name"]}>
            <input id="name" name="name" className={inputCls} />
          </Field>
          <Field label="Email" htmlFor="email" error={errors["email"]}>
            <input id="email" name="email" type="email" className={inputCls} />
          </Field>
          <Field label="Phone" htmlFor="phone" error={errors["phone"]}>
            <input id="phone" name="phone" type="tel" className={inputCls} />
          </Field>
          <Field label="Sport of interest" htmlFor="sport" error={errors["sport"]}>
            <select
              id="sport"
              name="sport"
              defaultValue=""
              className={inputCls}
              disabled={sportsQuery.isLoading || sportsQuery.isError || !sports.length}
            >
              <option value="" disabled>
                Select a sport
              </option>
              {sports.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {sportsQuery.isLoading && (
              <p className="mt-1 text-xs text-muted-foreground">Loading sports…</p>
            )}
            {sportsQuery.isError && (
              <p className="mt-1 text-xs text-destructive">{sportsQuery.error.message}</p>
            )}
            {sportsQuery.isSuccess && !sports.length && (
              <div role="status" className="mt-1 text-xs text-muted-foreground">
                No active sports are available right now. Please contact the academy or try again
                later.{" "}
                <button
                  type="button"
                  className="font-semibold text-foreground underline"
                  onClick={() => void sportsQuery.refetch()}
                >
                  Retry
                </button>
              </div>
            )}
          </Field>
          <div className="sm:col-span-2">
            <Field label="Message (optional)" htmlFor="message" error={errors["message"]}>
              <textarea
                id="message"
                name="message"
                rows={4}
                className={`${inputCls} h-auto py-2`}
              />
            </Field>
          </div>
          {requestError && (
            <p role="alert" className="sm:col-span-2 text-sm text-destructive">
              {requestError}
            </p>
          )}
          <Button
            type="submit"
            className="sm:col-span-2"
            disabled={pending || sportsQuery.isLoading || sportsQuery.isError || !sports.length}
          >
            {pending ? "Sending…" : "Send inquiry"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already a member?{" "}
          <Link to="/login" className="font-semibold text-foreground hover:text-highlight">
            Login
          </Link>
        </p>
      </div>
    </section>
  );
}
