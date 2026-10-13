import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CrudPage } from "@/components/admin/CrudPage";
import { PageHeader, Panel, selectCls } from "@/components/admin/ui";
import { resultOf } from "./-match-utils";
import { useOptions } from "@/hooks/use-options";
import { useList, useNames, useResourceList } from "@/hooks/use-resource";
import { api, type Performance } from "@/lib/api";
import { auth } from "@/lib/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/site/Button";
import { inputCls } from "@/components/site/FormField";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Performance — Athletix Admin" },
      { name: "description", content: "Player progress, match performance and attendance trends." },
    ],
  }),
  component: Analytics,
});

function Analytics() {
  return auth.get()?.role === "Coach" ? <CoachPerformance /> : <AdminAnalytics />;
}

function AdminAnalytics() {
  const sports = useList("sports"),
    teams = useList("teams"),
    matches = useList("matches"),
    sessions = useList("sessions"),
    attendance = useList("attendance"),
    perf = useList("performance"),
    players = useList("players");
  const playerOpts = useOptions("players"),
    matchOpts = matches
      .filter((m) => m.status === "Completed")
      .map((m) => ({ value: m.id, label: `${m.date} vs ${m.opponent}` }));
  const player = useNames("players");
  const [sportId, setSportId] = useState("");
  const teamIds = new Set(teams.filter((t) => !sportId || t.sportId === sportId).map((t) => t.id));

  const trend = [...new Set(sessions.map((s) => s.date))]
    .sort()
    .map((date) => {
      const ids = new Set(
        sessions.filter((s) => s.date === date && teamIds.has(s.teamId)).map((s) => s.id),
      );
      const a = attendance.filter((x) => ids.has(x.sessionId));
      return {
        date: date.slice(5),
        rate: a.length
          ? Math.round((a.filter((x) => x.status === "Present").length / a.length) * 100)
          : null,
      };
    })
    .filter((x) => x.rate !== null);

  const sportStats = sports
    .map((s) => {
      const ms = matches.filter(
        (m) => m.status === "Completed" && teams.find((t) => t.id === m.teamId)?.sportId === s.id,
      );
      return {
        name: s.name,
        Won: ms.filter((m) => resultOf(m) === "Won").length,
        Draw: ms.filter((m) => resultOf(m) === "Draw").length,
        Lost: ms.filter((m) => resultOf(m) === "Lost").length,
      };
    })
    .filter((s) => !sportId || sports.find((x) => x.name === s.name)?.id === sportId);

  const top = players
    .filter((p) => teamIds.has(p.teamId))
    .map((p) => {
      const r = perf.filter((x) => x.playerId === p.id);
      return {
        name: p.name.split(" ")[0]!,
        avg: r.length ? +(r.reduce((t, x) => t + x.rating, 0) / r.length).toFixed(1) : 0,
      };
    })
    .filter((x) => x.avg)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance analytics"
        text="Progress, results and attendance at a glance."
      >
        <select
          aria-label="Filter by sport"
          value={sportId}
          onChange={(e) => setSportId(e.target.value)}
          className={selectCls}
        >
          <option value="">All sports</option>
          {sports.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Attendance trend (%)">
          <div className="h-60">
            <ResponsiveContainer>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis domain={[0, 100]} fontSize={12} />
                <Tooltip />
                <Line
                  dataKey="rate"
                  stroke="var(--color-foreground)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-primary)", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Match results by sport">
          <div className="h-60">
            <ResponsiveContainer>
              <BarChart data={sportStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="Won" stackId="a" fill="var(--color-primary)" />
                <Bar dataKey="Draw" stackId="a" fill="var(--color-muted-foreground)" />
                <Bar dataKey="Lost" stackId="a" fill="var(--color-foreground)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Top players by average match rating" className="lg:col-span-2">
          <div className="h-60">
            <ResponsiveContainer>
              <BarChart data={top}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis domain={[0, 10]} fontSize={12} />
                <Tooltip />
                <Bar
                  dataKey="avg"
                  fill="var(--color-primary)"
                  stroke="var(--color-foreground)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
      <CrudPage<Performance>
        embedded
        resource="performance"
        title="Match performance log"
        singular="Rating"
        searchKeys={["notes"]}
        filters={[{ name: "playerId", label: "Players", options: playerOpts }]}
        columns={[
          {
            key: "playerId",
            label: "Player",
            render: (r) => <span className="font-semibold">{player(r.playerId)}</span>,
            csv: (r) => player(r.playerId),
          },
          {
            key: "matchId",
            label: "Match",
            render: (r) => matchOpts.find((m) => m.value === r.matchId)?.label ?? "—",
          },
          { key: "rating", label: "Rating", render: (r) => `${r.rating}/10` },
          { key: "notes", label: "Coach notes" },
        ]}
        fields={[
          {
            name: "playerId",
            label: "Player",
            type: "select",
            options: playerOpts,
            required: true,
          },
          {
            name: "matchId",
            label: "Completed match (optional)",
            type: "select",
            options: matchOpts,
          },
          { name: "rating", label: "Rating (1–10)", type: "number", required: true },
          { name: "notes", label: "Coach feedback", type: "textarea", required: true, full: true },
        ]}
      />
    </div>
  );
}

function CoachPerformance() {
  const playersQuery = useResourceList("players");
  const matchesQuery = useResourceList("matches");
  const performanceQuery = useResourceList("performance");
  const players = playersQuery.data ?? [];
  const matches = (matchesQuery.data ?? []).filter((match) => match.status === "Completed");
  const performance = performanceQuery.data ?? [];
  const queryClient = useQueryClient();
  const [playerId, setPlayerId] = useState("");
  const [matchId, setMatchId] = useState("");
  const [rating, setRating] = useState("7");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const createFeedback = useMutation({
    mutationFn: (entry: Partial<Performance>) => api.performance.create(entry),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["performance"] });
      setPlayerId("");
      setMatchId("");
      setRating("7");
      setNotes("");
      setError("");
      toast.success("Coach feedback saved");
    },
  });
  const playerNames = new Map(players.map((player) => [player.id, player.name]));
  const matchLabels = new Map(
    matches.map((match) => [match.id, `${match.date} · ${match.opponent}`]),
  );
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const player = players.find((candidate) => candidate.id === playerId);
    if (!player) {
      setError("Choose a player from one of your assigned teams.");
      return;
    }
    setError("");
    try {
      await createFeedback.mutateAsync({
        playerId: player.id,
        teamId: player.teamId,
        ...(matchId ? { matchId } : {}),
        rating: Number(rating),
        notes: notes.trim(),
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save coach feedback.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Player performance"
        text="Add coach ratings and feedback for your assigned teams."
      />
      <Panel title="Add coach feedback">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Player *
            <select
              required
              value={playerId}
              onChange={(event) => setPlayerId(event.target.value)}
              className={`${selectCls} mt-1 w-full`}
              disabled={playersQuery.isLoading || playersQuery.isError}
            >
              <option value="">Select player…</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Completed match (optional)
            <select
              value={matchId}
              onChange={(event) => setMatchId(event.target.value)}
              className={`${selectCls} mt-1 w-full`}
              disabled={matchesQuery.isLoading || matchesQuery.isError}
            >
              <option value="">General feedback</option>
              {matches.map((match) => (
                <option key={match.id} value={match.id}>
                  {match.date} · {match.opponent}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Rating (1–10) *
            <input
              required
              min="1"
              max="10"
              step="0.1"
              type="number"
              value={rating}
              onChange={(event) => setRating(event.target.value)}
              className={`${inputCls} mt-1`}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Coach feedback *
            <textarea
              required
              maxLength={2000}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className={`${inputCls} mt-1 min-h-24`}
            />
          </label>
          {(error || playersQuery.isError || matchesQuery.isError || performanceQuery.isError) && (
            <p role="alert" className="sm:col-span-2 text-sm text-destructive">
              {error ||
                (playersQuery.isError
                  ? "Could not load assigned players."
                  : matchesQuery.isError
                    ? "Could not load assigned matches."
                    : "Could not load existing feedback.")}
            </p>
          )}
          {playersQuery.isLoading && (
            <p className="sm:col-span-2 text-sm text-muted-foreground">Loading assigned players…</p>
          )}
          {!playersQuery.isLoading && !playersQuery.isError && !players.length && (
            <p className="sm:col-span-2 text-sm text-muted-foreground">
              No players are assigned to your teams yet.
            </p>
          )}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={createFeedback.isPending || !players.length}>
              {createFeedback.isPending ? "Saving…" : "Save feedback"}
            </Button>
          </div>
        </form>
      </Panel>
      <Panel title="Recent feedback">
        {performanceQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading feedback…</p>
        ) : performanceQuery.isError ? (
          <p role="alert" className="text-sm text-destructive">
            Could not load existing feedback.
          </p>
        ) : !performance.length ? (
          <p className="text-sm text-muted-foreground">No feedback has been recorded yet.</p>
        ) : (
          <ul className="divide-y">
            {[...performance]
              .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
              .map((entry) => (
                <li key={entry.id} className="py-3">
                  <div className="flex justify-between gap-3">
                    <span className="font-medium">
                      {playerNames.get(entry.playerId) ?? "Player"}
                      {entry.matchId && matchLabels.has(entry.matchId)
                        ? ` · ${matchLabels.get(entry.matchId)}`
                        : " · General feedback"}
                    </span>
                    <span>{entry.rating}/10</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{entry.notes}</p>
                </li>
              ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
