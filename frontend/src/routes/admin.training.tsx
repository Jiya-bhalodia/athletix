import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CrudPage } from "@/components/admin/CrudPage";
import { PageHeader, Panel, StatusBadge, selectCls } from "@/components/admin/ui";
import { Button } from "@/components/site/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOptions } from "@/hooks/use-options";
import { useList, useMutations, useNames } from "@/hooks/use-resource";
import { api, coachApi, type Session } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/admin/training")({
  head: () => ({
    meta: [
      { title: "Training & Attendance — Athletix Admin" },
      { name: "description", content: "Schedule sessions and mark attendance." },
    ],
  }),
  component: Training,
});

function MarkAttendance({ session, onClose }: { session: Session; onClose: () => void }) {
  const players = useList("players").filter((p) => p.teamId === session.teamId);
  const attendance = useList("attendance").filter((a) => a.sessionId === session.id);
  const qc = useQueryClient();
  const [marks, setMarks] = useState<Record<string, "Present" | "Absent">>(() =>
    Object.fromEntries(
      players.map((p) => [p.id, attendance.find((a) => a.playerId === p.id)?.status ?? "Present"]),
    ),
  );
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      const records = players.map((p) => ({ playerId: p.id, status: marks[p.id] ?? "Present" }));
      if (auth.get()?.role === "Coach")
        await coachApi.attendance(session.teamId, session.id, records);
      else {
        for (const record of records) {
          const existing = attendance.find((a) => a.playerId === record.playerId);
          if (existing) await api.attendance.update(existing.id, { status: record.status });
          else await api.attendance.create({ sessionId: session.id, ...record });
        }
      }
      await qc.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Attendance saved");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save attendance");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {session.title} · {session.date}
          </DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 text-xs">
          <button
            className="font-semibold hover:text-highlight"
            onClick={() => setMarks(Object.fromEntries(players.map((p) => [p.id, "Present"])))}
          >
            Mark all present
          </button>
        </div>
        <ul className="max-h-80 divide-y overflow-y-auto">
          {players.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2 text-sm">
              <span>{p.name}</span>
              <div className="inline-flex rounded-md border p-0.5">
                {(["Present", "Absent"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setMarks({ ...marks, [p.id]: s })}
                    aria-pressed={marks[p.id] === s}
                    className={`rounded px-3 py-1 text-xs font-semibold ${marks[p.id] === s ? (s === "Present" ? "bg-primary" : "bg-destructive text-destructive-foreground") : "text-muted-foreground"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </li>
          ))}
          {!players.length && (
            <li className="py-6 text-center text-sm text-muted-foreground">
              No players on this team.
            </li>
          )}
        </ul>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!players.length || saving}>
            {saving ? "Saving…" : "Save attendance"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Training() {
  const teams = useOptions("teams"),
    coachOptions = useOptions("coaches"),
    isCoach = auth.get()?.role === "Coach",
    coaches = isCoach ? [] : coachOptions;
  const team = useNames("teams"),
    coach = useNames("coaches");
  const players = useList("players"),
    attendance = useList("attendance"),
    sessions = useList("sessions");
  const [marking, setMarking] = useState<Session | null>(null);
  const [teamFilter, setTeamFilter] = useState("");
  const rate = (sid: string) => {
    const a = attendance.filter((x) => x.sessionId === sid);
    return a.length
      ? `${Math.round((a.filter((x) => x.status === "Present").length / a.length) * 100)}%`
      : "Not marked";
  };
  const history = players
    .filter((p) => !teamFilter || p.teamId === teamFilter)
    .map((p) => {
      const a = attendance.filter((x) => x.playerId === p.id);
      const present = a.filter((x) => x.status === "Present").length;
      return {
        p,
        total: a.length,
        present,
        pct: a.length ? Math.round((present / a.length) * 100) : null,
      };
    });
  const sessionName = (id: string) => sessions.find((s) => s.id === id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training & attendance"
        text="Plan sessions, mark attendance and track consistency."
      />
      <CrudPage<Session>
        embedded
        resource="sessions"
        title="Training sessions"
        singular="Session"
        searchKeys={["title", "venue"]}
        filters={[{ name: "teamId", label: "Teams", options: teams }]}
        rowActions={(s) => (
          <button
            onClick={() => setMarking(s)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold hover:bg-secondary"
          >
            <ClipboardCheck className="h-4 w-4" />
            Attendance
          </button>
        )}
        columns={[
          {
            key: "title",
            label: "Session",
            render: (r) => <span className="font-semibold">{r.title}</span>,
          },
          {
            key: "teamId",
            label: "Team",
            render: (r) => team(r.teamId),
            csv: (r) => team(r.teamId),
          },
          {
            key: "coachId",
            label: "Coach",
            render: (r) => coach(r.coachId),
            csv: (r) => coach(r.coachId),
          },
          { key: "date", label: "Date" },
          { key: "time", label: "Time" },
          { key: "venue", label: "Venue" },
          { key: "rate", label: "Attendance", render: (r) => rate(r.id), csv: (r) => rate(r.id) },
        ]}
        fields={[
          { name: "title", label: "Session title", required: true },
          { name: "teamId", label: "Team", type: "select", options: teams, required: true },
          ...(!isCoach
            ? [
                {
                  name: "coachId",
                  label: "Coach",
                  type: "select" as const,
                  options: coaches,
                  required: true,
                },
              ]
            : []),
          { name: "venue", label: "Venue", required: true },
          { name: "date", label: "Date", type: "date", required: true },
          { name: "time", label: "Time", type: "time", required: true },
        ]}
      />
      <Panel
        title="Attendance by player"
        action={
          <select
            aria-label="Filter by team"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className={selectCls}
          >
            <option value="">All teams</option>
            {teams.map((t) => (
              <option key={t.value} value={t.value} disabled={t.disabled}>
                {t.label}
              </option>
            ))}
          </select>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2">Player</th>
                <th className="px-3 py-2">Team</th>
                <th className="px-3 py-2">Sessions</th>
                <th className="px-3 py-2">Present</th>
                <th className="px-3 py-2 w-1/3">Rate</th>
              </tr>
            </thead>
            <tbody>
              {history.map(({ p, total, present, pct }) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2">{team(p.teamId)}</td>
                  <td className="px-3 py-2">{total}</td>
                  <td className="px-3 py-2">{present}</td>
                  <td className="px-3 py-2">
                    {pct === null ? (
                      "—"
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-secondary">
                          <div
                            className="h-2 rounded-full bg-primary ring-1 ring-foreground/20"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-xs">{pct}%</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Recent attendance records">
        <ul className="divide-y text-sm">
          {attendance.slice(0, 8).map((a) => (
            <li key={a.id} className="flex justify-between py-2">
              <span>
                {players.find((p) => p.id === a.playerId)?.name} ·{" "}
                <span className="text-muted-foreground">
                  {sessionName(a.sessionId)?.title} ({sessionName(a.sessionId)?.date})
                </span>
              </span>
              <StatusBadge value={a.status} />
            </li>
          ))}
        </ul>
      </Panel>
      {marking && <MarkAttendance session={marking} onClose={() => setMarking(null)} />}
    </div>
  );
}
