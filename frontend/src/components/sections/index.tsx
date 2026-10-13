import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Clock, Mail, MapPin, Medal, Phone } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import hero from "@/assets/hero.jpg";
import about from "@/assets/about.jpg";
import facility from "@/assets/facility.jpg";
import { coaching, contact, pathway, pillars, type Sport } from "@/data/academy";
import { publicApi } from "@/lib/api/client";
import { buttonStyles } from "@/components/site/button-styles";
import { SectionHeading } from "@/components/site/SectionHeading";

export function Hero() {
  return (
    <section className="container-site grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-highlight" /> Multi-sport academy
        </span>
        <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          Train with purpose.
          <br />
          Grow as a team.
        </h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          Athletix helps young players build skills, confidence and character through structured
          coaching across six sports.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/enroll" className={buttonStyles()}>
            Join Academy <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/sports" className={buttonStyles({ variant: "outline" })}>
            Explore Sports
          </Link>
        </div>
      </div>
      <img
        src={hero}
        alt="Coach guiding young athletes through agility drills"
        width={1200}
        height={1008}
        className="aspect-[6/5] w-full rounded-xl border object-cover"
      />
    </section>
  );
}

export function About() {
  return (
    <section id="about" className="bg-secondary/50 py-20">
      <div className="container-site grid gap-12 md:grid-cols-2">
        <img
          src={about}
          alt="Youth team huddle with hands together"
          loading="lazy"
          width={1200}
          height={912}
          className="w-full rounded-xl border object-cover"
        />
        <div>
          <SectionHeading
            eyebrow="About the academy"
            title="Built around growth, not just results"
            text="Our purpose is to give every player a safe, structured place to learn sport properly — and enjoy it. We believe good habits and good people make good athletes."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {pillars.map((p) => (
              <div key={p.title} className="rounded-lg border bg-background p-4">
                <p className="font-semibold">{p.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="container-site mt-14">
        <p className="eyebrow mb-4">Player pathway</p>
        <div className="grid gap-4 md:grid-cols-3">
          {pathway.map((s) => (
            <div key={s.step} className="rounded-lg border bg-background p-5">
              <span className="text-sm font-bold text-highlight">{s.step}</span>
              <p className="mt-1 font-semibold">{s.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SportCard({ s }: { s: Sport }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="group rounded-lg border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-foreground/25">
      <div className="grid h-11 w-11 place-items-center rounded-md bg-accent text-xl">
        {s.emoji}
      </div>
      <h3 className="mt-4 font-semibold">{s.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
      {open && <p className="mt-3 border-t pt-3 text-sm">{s.details}</p>}
      <button
        onClick={() => setOpen(!open)}
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold hover:text-highlight"
        aria-expanded={open}
      >
        {open ? "Show less" : "Learn more"}{" "}
        <ArrowRight className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
    </div>
  );
}

export function Sports() {
  const query = useQuery({ queryKey: ["public", "sports"], queryFn: publicApi.sports });
  const sports = query.data as Sport[] | undefined;
  return (
    <section id="sports" className="container-site py-20">
      <SectionHeading
        eyebrow="Sports offered"
        title="Six sports, one academy"
        text="Pick a sport to start with — players are welcome to try more than one."
      />
      {query.isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading sports…</p>
      ) : query.isError ? (
        <p role="alert" className="py-8 text-center text-sm text-destructive">
          {query.error.message}
        </p>
      ) : !sports?.length ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No sports are currently available.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sports.map((s) => (
            <SportCard key={s.id} s={s} />
          ))}
        </div>
      )}
    </section>
  );
}

export function Coaching() {
  return (
    <section id="coaching" className="bg-secondary/50 py-20">
      <div className="container-site grid items-center gap-12 md:grid-cols-2">
        <div>
          <SectionHeading eyebrow="Coaching & facilities" title="Structured training, every week" />
          <div className="space-y-5">
            {coaching.map((c) => (
              <div key={c.title} className="flex gap-4">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-highlight" />
                <div>
                  <p className="font-semibold">{c.title}</p>
                  <p className="text-sm text-muted-foreground">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <img
          src={facility}
          alt="Indoor training hall with basketball and badminton courts (illustrative)"
          loading="lazy"
          width={1200}
          height={912}
          className="w-full rounded-xl border object-cover"
        />
      </div>
    </section>
  );
}

export function Achievements({ showLink = true }: { showLink?: boolean }) {
  const query = useQuery({ queryKey: ["public", "achievements"], queryFn: publicApi.achievements });
  const items = (query.data ?? []) as {
    id: string;
    title: string;
    type: string;
    recipient: string;
    sport: string;
    date: string;
  }[];
  return (
    <section id="achievements" className="container-site py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Achievements"
          title="Moments we're proud of"
          text="Highlights featured by our coaches."
        />
        {showLink && (
          <Link
            to="/achievements"
            className="mb-10 inline-flex items-center gap-1 text-sm font-semibold hover:text-highlight"
          >
            View all achievements <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      {query.isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading achievements…</p>
      ) : query.isError ? (
        <p role="alert" className="py-8 text-center text-sm text-destructive">
          {query.error.message}
        </p>
      ) : !items.length ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No featured achievements yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((a) => (
            <div key={a.id} className="rounded-lg border p-5">
              <Medal className="h-5 w-5 text-highlight" />
              <p className="mt-3 font-semibold leading-snug">{a.title}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {a.sport} · {a.type} · {a.recipient} · {a.date.slice(0, 4)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function Events() {
  const query = useQuery({
    queryKey: ["public", "announcements"],
    queryFn: publicApi.announcements,
  });
  const events = (
    (query.data ?? []) as { id: string; title: string; kind: string; date: string; body: string }[]
  ).filter((item) => item.kind === "Event" || item.kind === "Announcement");
  return (
    <section id="events" className="container-site pb-20">
      <SectionHeading
        eyebrow="Events & updates"
        title="What's coming up"
        text="Published academy announcements and events."
      />
      {query.isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading events…</p>
      ) : query.isError ? (
        <p role="alert" className="py-8 text-center text-sm text-destructive">
          {query.error.message}
        </p>
      ) : !events.length ? (
        <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
          No published events or announcements.
        </p>
      ) : (
        <div className="divide-y rounded-lg border">
          {events.map((e) => (
            <div
              key={e.id}
              className="flex flex-col gap-2 p-5 md:flex-row md:items-center md:gap-8"
            >
              <span className="inline-flex w-36 items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {e.date.slice(0, 10)}
              </span>
              <div className="flex-1">
                <p className="font-semibold">{e.title}</p>
                <p className="text-sm text-muted-foreground">{e.body}</p>
              </div>
              <span className="w-fit rounded-full bg-accent px-3 py-1 text-xs font-semibold">
                {e.kind}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function Cta() {
  return (
    <section className="container-site pb-20">
      <div className="flex flex-col items-start justify-between gap-6 rounded-xl bg-ink p-8 text-ink-foreground md:flex-row md:items-center md:p-12">
        <div>
          <h2 className="text-2xl font-bold md:text-3xl">Join the academy</h2>
          <p className="mt-2 max-w-lg opacity-75">
            Interested players and parents can send an enrollment inquiry or contact us for batch
            timings and details.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/enroll" className={buttonStyles()}>
            Send inquiry
          </Link>
          <Link
            to="/contact"
            className="inline-flex h-11 items-center rounded-md border border-ink-foreground/30 px-5 text-sm font-semibold hover:bg-ink-foreground/10"
          >
            Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}

export function Contact() {
  const items = [
    { icon: MapPin, label: "Address", value: contact.address },
    { icon: Phone, label: "Phone", value: contact.phone },
    { icon: Mail, label: "Email", value: contact.email },
    { icon: Clock, label: "Training hours", value: contact.hours },
  ];
  return (
    <section id="contact" className="bg-secondary/50 py-20">
      <div className="container-site">
        <SectionHeading
          eyebrow="Contact"
          title="Get in touch"
          text="Sample academy contact details for this demo project."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-lg border bg-background p-5">
              <Icon className="h-5 w-5" />
              <p className="mt-3 text-sm font-semibold">{label}</p>
              <p className="text-sm text-muted-foreground">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-muted-foreground">Follow us (links coming soon):</span>
          {contact.socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              onClick={(e) => e.preventDefault()}
              className="rounded-full border bg-background px-3 py-1 hover:bg-primary"
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
