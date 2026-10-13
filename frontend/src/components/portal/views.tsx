import { Link } from "@tanstack/react-router";
import { Award, CalendarDays, Lock, Medal, MapPin, Star, Trophy } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Empty, Panel, StatCard, StatusBadge } from "@/components/admin/ui";
import { chartColors } from "@/components/admin/chart-colors";
import { usePlayerView } from "@/hooks/use-portal";
import type { PlayerView } from "@/lib/api/portal";
import { fmt, inr } from "./view-formatters";

type V = NonNullable<PlayerView>;
const initials = (n: string) =>
  n
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

/** Loads one player's view and renders loading / not-found states. */
export function WithPlayer({
  playerId,
  children,
}: {
  playerId: string | undefined;
  children: (v: V) => React.ReactNode;
}) {
  const query = usePlayerView(playerId);
  if (query.isLoading)
    return (
      <div className="space-y-3" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-card" />
        ))}
      </div>
    );
  if (query.isError)
    return (
      <Panel>
        <Empty
          text={
            query.error instanceof Error
              ? query.error.message
              : "Could not load portal information."
          }
        />
        <button className="mt-3 text-sm underline" onClick={() => void query.refetch()}>
          Retry
        </button>
      </Panel>
    );
  if (!query.data)
    return (
      <Panel>
        <Empty text="No linked player record was found for this account." />
      </Panel>
    );
  return <>{children(query.data as V)}</>;
}

export function ReadOnlyNote({ text }: { text: string }) {
  return (
    <p className="mb-4 flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-xs">
      <Lock className="h-3.5 w-3.5" />
      {text}
    </p>
  );
}

export function ProfileSummary({ v }: { v: V }) {
  const rows: [string, string][] = [
    ["Sport", v.sport?.name ?? "—"],
    ["Team", v.team?.name ?? "—"],
    ["Coach", v.coach?.name ?? "—"],
    ["Joined", fmt(v.player.joinDate)],
  ];
  return (
    <Panel>
      <div className="flex items-center gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary text-lg font-bold">
          {initials(v.player.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{v.player.name}</p>
          <p className="text-sm text-muted-foreground">
            Age {v.player.age} · <StatusBadge value={v.player.status} />
          </p>
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        {rows.map(([k, val]) => (
          <div key={k}>
            <dt className="eyebrow">{k}</dt>
            <dd className="mt-0.5 font-medium">{val}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

export function SummaryStats({ v }: { v: V }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatCard
        label="Attendance"
        value={v.attendancePct === null ? "—" : `${v.attendancePct}%`}
        hint={`${v.attendance.length} sessions recorded`}
        icon={CalendarDays}
      />
      <StatCard
        label="Avg. rating"
        value={v.avgRating ?? "—"}
        hint={v.performance.length ? `Across ${v.performance.length} matches` : "No ratings yet"}
        icon={Star}
      />
      <StatCard
        label="Achievements"
        value={v.achievements.length}
        hint="Personal and team"
        icon={Award}
      />
    </div>
  );
}

export function UpcomingPanel({
  v,
  trainingTo,
  matchesTo,
}: {
  v: V;
  trainingTo: string;
  matchesTo: string;
}) {
  const items = [
    ...v.upcomingSessions.map((s) => ({
      id: s.id,
      date: s.date,
      title: s.title,
      meta: `${s.time} · ${s.venue}`,
      kind: "Training",
    })),
    ...v.upcomingMatches.map((m) => ({
      id: m.id,
      date: m.date,
      title: `vs ${m.opponent}`,
      meta: `${m.tournament} · ${m.venue}`,
      kind: "Match",
    })),
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);
  return (
    <Panel
      title="Coming up"
      action={
        <div className="flex gap-3 text-xs font-semibold">
          <Link to={trainingTo} className="hover:text-highlight">
            Training
          </Link>
          <Link to={matchesTo} className="hover:text-highlight">
            Matches
          </Link>
        </div>
      }
    >
      {items.length ? (
        <ul className="divide-y">
          {items.map((i) => (
            <li key={i.id} className="flex items-center gap-3 py-2.5">
              <span className="w-16 shrink-0 text-xs font-semibold">{fmt(i.date).slice(0, 6)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{i.title}</p>
                <p className="truncate text-xs text-muted-foreground">{i.meta}</p>
              </div>
              <span
                className={
                  i.kind === "Match"
                    ? "rounded-full bg-primary px-2 py-0.5 text-xs font-semibold"
                    : "rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
                }
              >
                {i.kind}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <Empty text="Nothing scheduled yet." />
      )}
    </Panel>
  );
}

export function AnnouncementsPanel({ v }: { v: V }) {
  return (
    <Panel title="Academy updates">
      {v.announcements.length ? (
        <ul className="space-y-3">
          {v.announcements.slice(0, 3).map((a) => (
            <li key={a.id}>
              <p className="text-sm font-medium">{a.title}</p>
              <p className="text-xs text-muted-foreground">
                {a.kind} · {fmt(a.date)} — {a.body}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <Empty text="No announcements right now." />
      )}
    </Panel>
  );
}

export function AchievementList({ v, limit }: { v: V; limit?: number }) {
  const list = limit ? v.achievements.slice(0, limit) : v.achievements;
  if (!list.length) return <Empty text="No achievements recorded yet — keep training!" />;
  const Icon = { Trophy, Medal, Award, Milestone: Star } as const;
  return (
    <ul className={limit ? "space-y-3" : "grid gap-3 sm:grid-cols-2"}>
      {list.map((a) => {
        const I = Icon[a.type];
        return (
          <li
            key={a.id}
            className={limit ? "flex gap-3" : "flex gap-3 rounded-lg border bg-card p-4"}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent">
              <I className="h-4 w-4 text-highlight" />
            </span>
            <div>
              <p className="text-sm font-semibold">{a.title}</p>
              <p className="text-xs text-muted-foreground">
                {a.type} · {fmt(a.date)}
                {a.recipient === v.team?.name ? " · Team" : ""}
              </p>
              {!limit && a.description && <p className="mt-1 text-sm">{a.description}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function TrainingView({ v, who }: { v: V; who: string }) {
  return (
    <div className="space-y-4">
      <ReadOnlyNote
        text={`Attendance is recorded by coaches. ${who} can view it but not change it.`}
      />
      <SummaryStats v={v} />
      <Panel title="Upcoming sessions">
        {v.upcomingSessions.length ? (
          <ul className="divide-y">
            {v.upcomingSessions.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
              >
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    <MapPin className="mr-1 inline h-3 w-3" />
                    {s.venue} · Coach {v.coach?.name ?? "—"}
                  </p>
                </div>
                <span className="text-xs font-semibold">
                  {fmt(s.date)} · {s.time}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty text="No upcoming sessions scheduled." />
        )}
      </Panel>
      <Panel title="Attendance history">
        {v.attendance.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="py-2">Date</th>
                  <th>Session</th>
                  <th>Venue</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {v.attendance.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2 pr-3 whitespace-nowrap">{fmt(a.session!.date)}</td>
                    <td className="pr-3">{a.session!.title}</td>
                    <td className="pr-3 text-muted-foreground">{a.session!.venue}</td>
                    <td>
                      <StatusBadge value={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text="No attendance recorded yet." />
        )}
      </Panel>
    </div>
  );
}

function result(m: { ourScore: number | null; theirScore: number | null }) {
  if (m.ourScore === null || m.theirScore === null) return "—";
  return m.ourScore > m.theirScore ? "Won" : m.ourScore < m.theirScore ? "Lost" : "Draw";
}

export function MatchesView({ v }: { v: V }) {
  return (
    <div className="space-y-4">
      <Panel title="Upcoming fixtures">
        {v.upcomingMatches.length ? (
          <ul className="divide-y">
            {v.upcomingMatches.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {v.team?.name} vs {m.opponent}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.tournament} · {m.venue}
                  </p>
                </div>
                <span className="text-xs font-semibold">{fmt(m.date)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty text="No upcoming fixtures." />
        )}
      </Panel>
      <Panel title="Previous matches">
        {v.pastMatches.length ? (
          <ul className="divide-y">
            {v.pastMatches.map((m) => {
              const note = v.performance.find((p) => p.matchId === m.id);
              return (
                <li key={m.id} className="py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">vs {m.opponent}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmt(m.date)} · {m.tournament} · {m.venue}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">
                        {m.ourScore}–{m.theirScore}
                      </span>
                      <StatusBadge value={result(m)} />
                    </div>
                  </div>
                  {note && (
                    <p className="mt-2 rounded-md bg-muted px-3 py-2 text-xs">
                      Coach note: {note.notes} · Rating {note.rating}/10
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty text="No completed matches yet." />
        )}
      </Panel>
    </div>
  );
}

export function PerformanceView({ v, who }: { v: V; who: string }) {
  const data = v.performance.map((p) => ({
    name: p.match ? `vs ${p.match.opponent}` : p.createdAt ? fmt(p.createdAt) : "Training",
    rating: p.rating,
  }));
  return (
    <div className="space-y-4">
      <ReadOnlyNote text={`Ratings and feedback are set by coaches. ${who} cannot edit them.`} />
      <SummaryStats v={v} />
      <Panel title="Match ratings over time">
        {data.length ? (
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={data} margin={{ left: -20, right: 10, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="rating"
                  stroke={chartColors[0]}
                  strokeWidth={2}
                  dot={{ fill: chartColors[1], r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty text="No ratings have been recorded for this player yet. An admin can add a rating and coach note from Admin → Performance." />
        )}
      </Panel>
      <Panel title="Coach feedback">
        {v.performance.length ? (
          <ul className="divide-y">
            {[...v.performance].reverse().map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div>
                  <p className="font-medium">{p.notes}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.match
                      ? `vs ${p.match.opponent} · ${fmt(p.match.date)}`
                      : p.createdAt
                        ? `Coach note · ${fmt(p.createdAt)}`
                        : "Coach note"}
                  </p>
                </div>
                <span className="font-bold">{p.rating}/10</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty text="No coach feedback has been recorded for this player yet. Add a performance entry from Admin → Performance to show the rating and note here." />
        )}
      </Panel>
      <Panel title={`${v.sport?.name ?? "Sport"} statistics`}>
        <p className="mb-3 text-xs text-muted-foreground">
          Team results and player attendance from records already entered in the academy system.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Completed matches" value={v.matchRecord.played} icon={Trophy} />
          <StatCard
            label="Team record (W–D–L)"
            value={`${v.matchRecord.won}–${v.matchRecord.drawn}–${v.matchRecord.lost}`}
            icon={Award}
          />
          <StatCard label="Team score for" value={v.matchRecord.scoreFor} icon={Star} />
          <StatCard label="Team score against" value={v.matchRecord.scoreAgainst} icon={Star} />
          <StatCard
            label="Player attendance"
            value={v.attendancePct === null ? "—" : `${v.attendancePct}%`}
            hint={`${v.attendance.length} sessions recorded`}
            icon={CalendarDays}
          />
          <StatCard
            label="Player average rating"
            value={v.avgRating ?? "—"}
            hint={
              v.performance.length
                ? `${v.performance.length} coach ratings`
                : "No coach ratings yet"
            }
            icon={Star}
          />
        </div>
      </Panel>
    </div>
  );
}

export function FeesView({ v }: { v: V }) {
  const plan = v.fees[0]?.plan;
  const next = [...v.fees]
    .filter((f) => f.status !== "Paid")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  return (
    <div className="space-y-4">
      <ReadOnlyNote text="Read-only fee and manual payment records. Contact the academy office to arrange payment; online payment is not enabled." />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Total fees"
          value={inr(v.totalFees)}
          hint={plan ? `${plan.name} · ${plan.frequency}` : "No plan assigned"}
          icon={Award}
        />
        <StatCard label="Paid" value={inr(v.paid)} icon={Star} />
        <StatCard
          label="Outstanding"
          value={inr(v.outstanding)}
          hint={next ? `Next due ${fmt(next.dueDate)}` : "All settled"}
          icon={CalendarDays}
        />
      </div>
      <Panel title="Fee records">
        {v.fees.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="py-2">Due date</th>
                  <th>Plan</th>
                  <th>Fee</th>
                  <th>Paid</th>
                  <th>Pending</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {v.fees.map((f) => (
                  <tr key={f.id}>
                    <td className="py-2 pr-3 whitespace-nowrap">{fmt(f.dueDate)}</td>
                    <td className="pr-3">{f.plan?.name ?? "—"}</td>
                    <td className="pr-3">{inr(f.amount)}</td>
                    <td className="pr-3">{inr(f.paidAmount ?? 0)}</td>
                    <td className="pr-3">
                      {inr(f.pendingAmount ?? Math.max(0, f.amount - (f.paidAmount ?? 0)))}
                    </td>
                    <td>
                      <StatusBadge value={f.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text="No fee records yet." />
        )}
      </Panel>
      <Panel title="Recorded transactions">
        {v.payments.length ? (
          <ul className="divide-y text-sm">
            {[...v.payments]
              .sort((a, b) => b.paidAt.localeCompare(a.paidAt))
              .map((payment) => (
                <li key={payment.id} className="flex justify-between gap-3 py-2">
                  <span>
                    {fmt(payment.paidAt)} · {payment.method} · {payment.status}
                  </span>
                  <b>{inr(payment.amount)}</b>
                </li>
              ))}
          </ul>
        ) : (
          <Empty text="No payments recorded." />
        )}
      </Panel>
    </div>
  );
}
