import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, Shirt, Trophy, UserCog, Users, Wallet } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader, Panel, StatCard, StatusBadge } from "@/components/admin/ui";
import { chartColors } from "@/components/admin/chart-colors";
import { useList, useNames } from "@/hooks/use-resource";
import { today } from "@/data/admin-seed";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Athletix Admin" },
      { name: "description", content: "Academy overview for coaches and admins." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const players = useList("players"),
    coaches = useList("coaches"),
    teams = useList("teams"),
    sports = useList("sports");
  const sessions = useList("sessions"),
    attendance = useList("attendance"),
    matches = useList("matches"),
    fees = useList("fees"),
    activity = useList("activities");
  const teamName = useNames("teams");
  const todayIds = new Set(sessions.filter((s) => s.date === today()).map((s) => s.id));
  const todayAtt = attendance.filter((a) => todayIds.has(a.sessionId));
  const present = todayAtt.filter((a) => a.status === "Present").length;
  const upcoming = matches
    .filter((m) => m.status === "Upcoming")
    .sort((a, b) => a.date.localeCompare(b.date));
  const pending = fees.filter((f) => f.status !== "Paid");
  const bySport = sports.map((s) => ({
    name: s.name,
    players: players.filter((p) => p.sportId === s.id).length,
  }));
  const feeMix = (["Paid", "Pending", "Overdue"] as const).map((st) => ({
    name: st,
    value: fees.filter((f) => f.status === st).length,
  }));

  return (
    <div>
      <PageHeader title="Dashboard" text="A quick look at how the academy is doing today." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard
          label="Players"
          value={players.length}
          hint={`${players.filter((p) => p.status === "Active").length} active`}
          icon={Users}
        />
        <StatCard label="Coaches" value={coaches.length} icon={UserCog} />
        <StatCard label="Teams" value={teams.length} icon={Shirt} />
        <StatCard
          label="Today's attendance"
          value={todayAtt.length ? `${Math.round((present / todayAtt.length) * 100)}%` : "—"}
          hint={`${present}/${todayAtt.length} present`}
          icon={CalendarCheck}
        />
        <StatCard label="Upcoming matches" value={upcoming.length} icon={Trophy} />
        <StatCard
          label="Pending fees"
          value={`₹${pending.reduce((s, f) => s + f.amount, 0).toLocaleString("en-IN")}`}
          hint={`${pending.length} players`}
          icon={Wallet}
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Players by sport" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={bySport}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar
                  dataKey="players"
                  fill="var(--color-primary)"
                  stroke="var(--color-foreground)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Fee status">
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={feeMix}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={85}
                  label
                >
                  {feeMix.map((_, i) => (
                    <Cell key={i} fill={chartColors[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel
          title="Upcoming matches"
          className="lg:col-span-2"
          action={
            <Link to="/admin/matches" className="text-xs font-semibold hover:text-highlight">
              View all
            </Link>
          }
        >
          <ul className="divide-y">
            {upcoming.slice(0, 4).map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2.5 text-sm">
                <span>
                  <b>{teamName(m.teamId)}</b> vs {m.opponent}
                  <span className="block text-xs text-muted-foreground">
                    {m.tournament} · {m.venue}
                  </span>
                </span>
                <span className="text-right">
                  <StatusBadge value={m.status} />
                  <span className="block text-xs text-muted-foreground">{m.date}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Recent activity">
          <ul className="space-y-3 text-sm">
            {activity.slice(0, 6).map((a) => (
              <li key={a.id} className="flex gap-2">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary ring-1 ring-foreground" />
                <span>
                  {a.text}
                  <span className="block text-xs text-muted-foreground">{a.at}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
