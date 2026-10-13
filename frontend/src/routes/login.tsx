import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/site/Button";
import { Field, inputCls } from "@/components/site/FormField";
import { auth, homeFor, type Role } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Athletix" },
      { name: "description", content: "Sign in to your Athletix academy account." },
      { property: "og:title", content: "Login — Athletix" },
      { property: "og:description", content: "Sign in to your Athletix academy account." },
    ],
  }),
  component: Login,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

function Login() {
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("Admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = schema.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!r.success) {
      setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message])));
      setNotice(null);
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const sess = await auth.signIn(r.data.email, r.data.password);
      if (!sess) {
        setErrors({ email: "The server did not return an authenticated account." });
        return;
      }
      const roleMatches =
        role === "Admin" ? sess.role === "Admin" || sess.role === "Coach" : sess.role === role;
      if (!roleMatches) {
        await auth.signOut();
        setErrors({
          email: `This account is not a ${role === "Admin" ? "coach/admin" : role.toLowerCase()} account.`,
        });
        return;
      }
      navigate({ to: homeFor(sess.role) });
    } catch (error) {
      setErrors({ email: error instanceof Error ? error.message : "Unable to sign in." });
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="container-site grid min-h-[70vh] place-items-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with the account provided by your academy. Choosing a role does not create an
          account.
        </p>
        <div
          role="radiogroup"
          aria-label="Sign in as"
          className="mt-6 grid grid-cols-3 gap-1 rounded-lg border p-1"
        >
          {(["Admin", "Player", "Parent"] as const).map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={role === r}
              onClick={() => {
                setRole(r);
                setErrors({});
              }}
              className={
                role === r
                  ? "rounded-md bg-primary py-2 text-sm font-semibold"
                  : "rounded-md py-2 text-sm text-muted-foreground hover:bg-secondary"
              }
            >
              {r === "Admin" ? "Coach/Admin" : r}
            </button>
          ))}
        </div>
        <form onSubmit={submit} noValidate className="mt-6 space-y-4">
          <Field label="Email" htmlFor="email" error={errors["email"]}>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              aria-invalid={!!errors["email"]}
            />
          </Field>
          <Field label="Password" htmlFor="password" error={errors["password"]}>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputCls} pr-11`}
                aria-invalid={!!errors["password"]}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="remember" className="h-4 w-4 accent-foreground" />{" "}
              Remember me
            </label>
            <button
              type="button"
              onClick={() =>
                setNotice(
                  "Password reset is not available yet. Contact the academy administrator to provision or reset your account.",
                )
              }
              className="font-medium hover:text-highlight"
            >
              Forgot password?
            </button>
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
          {notice && (
            <p className="rounded-md bg-accent p-3 text-sm" role="status">
              {notice}
            </p>
          )}
          {errors["email"] === "Invalid email or password" && (
            <p className="text-xs text-muted-foreground">
              If you are a new member, ask the academy administrator to create and link your login
              account first.
            </p>
          )}
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to Athletix?{" "}
          <Link to="/enroll" className="font-semibold text-foreground hover:text-highlight">
            Send an enrollment inquiry
          </Link>
        </p>
      </div>
    </section>
  );
}
