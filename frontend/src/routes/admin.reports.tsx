import { createFileRoute } from "@tanstack/react-router";
import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Empty, PageHeader, Panel, selectCls } from "@/components/admin/ui";
import { Button } from "@/components/site/Button";
import { inputCls } from "@/components/site/FormField";
import { resultOf } from "./-match-utils";
import { useList, useNames } from "@/hooks/use-resource";
import { downloadCsv } from "@/lib/csv";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Athletix Admin" },
      { name: "description", content: "Searchable reports with CSV export." },
    ],
  }),
  component: Reports,
});

const types = ["Players", "Attendance", "Matches", "Performance", "Achievements", "Fees"] as const;
type R = Record<string, string | number>;

function Reports() {
  const [type, setType] = useState<(typeof types)[number]>("Players");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const players = useList("players"),
    attendance = useList("attendance"),
    matches = useList("matches"),
    perf = useList("performance"),
    achievements = useList("achievements"),
    fees = useList("fees");
  const sport = useNames("sports"),
    team = useNames("teams"),
    player = useNames("players");

  const rows: { date: string; row: R }[] = useMemo(() => {
    switch (type) {
      case "Players":
        return players.map((p) => ({
          date: p.joinDate,
          row: {
            Name: p.name,
            Age: p.age,
            Sport: sport(p.sportId),
            Team: team(p.teamId),
            Phone: p.phone,
            Joined: p.joinDate,
            Status: p.status,
          },
        }));
      case "Attendance":
        return players.map((p) => {
          const a = attendance.filter((x) => x.playerId === p.id);
          const pr = a.filter((x) => x.status === "Present").length;
          return {
            date: "",
            row: {
              Player: p.name,
              Team: team(p.teamId),
              Sessions: a.length,
              Present: pr,
              Absent: a.length - pr,
              "Rate %": a.length ? Math.round((pr / a.length) * 100) : 0,
            },
          };
        });
      case "Matches":
        return matches.map((m) => ({
          date: m.date,
          row: {
            Date: m.date,
            Team: team(m.teamId),
            Opponent: m.opponent,
            Tournament: m.tournament,
            Venue: m.venue,
            Score: m.ourScore == null ? "" : `${m.ourScore}-${m.theirScore}`,
            Result: resultOf(m),
            Status: m.status,
          },
        }));
      case "Performance":
        return perf.map((x) => {
          const m = matches.find((mm) => mm.id === x.matchId);
          return {
            date: m?.date ?? "",
            row: {
              Player: player(x.playerId),
              Match: m ? `${m.date} vs ${m.opponent}` : "",
              Rating: x.rating,
              Notes: x.notes,
            },
          };
        });
      case "Achievements":
        return achievements.map((a) => ({
          date: a.date,
          row: {
            Date: a.date,
            Title: a.title,
            Type: a.type,
            Recipient: a.recipient ?? "",
            Sport: sport(a.sportId),
            Featured: a.featured,
          },
        }));
      case "Fees":
        return fees.map((f) => ({
          date: f.dueDate,
          row: {
            Player: player(f.playerId),
            Amount: f.amount,
            Due: f.dueDate,
            Status: f.status,
            "Paid on": f.paidDate ?? "",
            Method: f.method ?? "",
          },
        }));
    }
  }, [type, players, attendance, matches, perf, achievements, fees, sport, team, player]);

  const visible = rows
    .filter(
      ({ date, row }) =>
        (!q || Object.values(row).some((v) => String(v).toLowerCase().includes(q.toLowerCase()))) &&
        (!from || !date || date >= from) &&
        (!to || !date || date <= to),
    )
    .map((r) => r.row);
  const headers = Object.keys(rows[0]?.row ?? {});

  return (
    <div>
      <PageHeader title="Reports" text="Search, filter and export academy records.">
        <Button
          size="sm"
          variant="outline"
          onClick={() => downloadCsv(`athletix-${type.toLowerCase()}-report.csv`, visible)}
          disabled={!visible.length}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </PageHeader>
      <div className="mb-4 flex flex-wrap gap-2" role="tablist">
        {types.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={type === t}
            onClick={() => setType(t)}
            className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${type === t ? "bg-primary border-foreground/10" : "bg-background hover:bg-secondary"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <Panel>
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search report…"
              aria-label="Search report"
              className={`${inputCls} h-10 pl-9`}
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            From{" "}
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={selectCls}
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            To{" "}
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={selectCls}
            />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                {headers.map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((r, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted">
                  {headers.map((h) => (
                    <td key={h} className="whitespace-nowrap px-3 py-2">
                      {String(r[h] ?? "") || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && <Empty />}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{visible.length} rows</p>
      </Panel>
    </div>
  );
}
