import { createFileRoute } from "@tanstack/react-router";
import { UserMinus, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CrudPage } from "@/components/admin/CrudPage";
import { opts } from "@/components/admin/field-options";
import { PageHeader, selectCls } from "@/components/admin/ui";
import { Button } from "@/components/site/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOptions } from "@/hooks/use-options";
import { useList, useMutations, useNames, useResourceList } from "@/hooks/use-resource";
import type { Sport, Team } from "@/lib/api";

export const Route = createFileRoute("/admin/teams")({
  head: () => ({
    meta: [
      { title: "Sports & Teams — Athletix Admin" },
      { name: "description", content: "Manage sports, teams and rosters." },
    ],
  }),
  component: TeamsPage,
});

function Roster({ team, onClose }: { team: Team; onClose: () => void }) {
  const playersQuery = useResourceList("players");
  const players = playersQuery.data ?? [];
  const { update } = useMutations("players");
  const [pick, setPick] = useState("");
  const roster = players.filter((p) => p.teamId === team.id);
  const available = players.filter((p) => p.teamId !== team.id && p.sportId === team.sportId);
  const move = (id: string, teamId: string, msg: string) =>
    update.mutateAsync({ id, data: { teamId } }).then(() => toast.success(msg));
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{team.name} roster</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          <select
            aria-label="Player to add"
            value={pick}
            onChange={(e) => setPick(e.target.value)}
            className={`${selectCls} flex-1`}
          >
            <option value="">Add a player from this sport…</option>
            {playersQuery.isLoading && (
              <option value="__loading" disabled>
                Loading players…
              </option>
            )}
            {playersQuery.isError && (
              <option value="__error" disabled>
                Players failed to load — check connection and refresh
              </option>
            )}
            {!playersQuery.isLoading && !playersQuery.isError && available.length === 0 && (
              <option value="__empty" disabled>
                No unassigned players for this sport yet
              </option>
            )}
            {available.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            disabled={!pick}
            onClick={() => move(pick, team.id, "Player added").then(() => setPick(""))}
          >
            <UserPlus className="h-4 w-4" />
            Add
          </Button>
        </div>
        <ul className="max-h-80 divide-y overflow-y-auto">
          {roster.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                {p.name} <span className="text-xs text-muted-foreground">· {p.age} yrs</span>
              </span>
              <button
                onClick={() => move(p.id, "", "Player removed from team")}
                className="rounded-md p-2 text-destructive hover:bg-secondary"
                aria-label={`Remove ${p.name}`}
              >
                <UserMinus className="h-4 w-4" />
              </button>
            </li>
          ))}
          {!roster.length && (
            <li className="py-6 text-center text-sm text-muted-foreground">
              No players on this team yet.
            </li>
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

function TeamsPage() {
  const sports = useOptions("sports"),
    coaches = useOptions("coaches");
  const sport = useNames("sports"),
    coach = useNames("coaches");
  const players = useList("players"),
    teams = useList("teams");
  const [roster, setRoster] = useState<Team | null>(null);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sports & teams"
        text="Sports offered, teams, coach assignments and rosters."
      />
      <CrudPage<Team>
        embedded
        resource="teams"
        title="Teams"
        singular="Team"
        searchKeys={["name", "ageGroup"]}
        filters={[
          { name: "sportId", label: "Sports", options: sports },
          { name: "coachId", label: "Coaches", options: coaches },
        ]}
        rowActions={(t) => (
          <button
            onClick={() => setRoster(t)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold hover:bg-secondary"
          >
            <Users className="h-4 w-4" />
            Roster
          </button>
        )}
        columns={[
          {
            key: "name",
            label: "Team",
            render: (r) => <span className="font-semibold">{r.name}</span>,
          },
          {
            key: "sportId",
            label: "Sport",
            render: (r) => sport(r.sportId),
            csv: (r) => sport(r.sportId),
          },
          {
            key: "coachId",
            label: "Coach",
            render: (r) => coach(r.coachId),
            csv: (r) => coach(r.coachId),
          },
          { key: "ageGroup", label: "Age group" },
          {
            key: "size",
            label: "Players",
            render: (r) => players.filter((p) => p.teamId === r.id).length,
          },
        ]}
        fields={[
          { name: "name", label: "Team name", required: true },
          { name: "ageGroup", label: "Age group", required: true },
          { name: "sportId", label: "Sport", type: "select", options: sports, required: true },
          {
            name: "coachId",
            label: "Assigned coach",
            type: "select",
            options: coaches,
            required: true,
          },
        ]}
      />
      <CrudPage<Sport>
        embedded
        resource="sports"
        title="Sports"
        singular="Sport"
        searchKeys={["name"]}
        filters={[{ name: "category", label: "Categories", options: opts(["Team", "Individual"]) }]}
        columns={[
          {
            key: "name",
            label: "Sport",
            render: (r) => <span className="font-semibold">{r.name}</span>,
          },
          { key: "category", label: "Category" },
          {
            key: "teams",
            label: "Teams",
            render: (r) => teams.filter((t) => t.sportId === r.id).length,
          },
          {
            key: "players",
            label: "Players",
            render: (r) => players.filter((p) => p.sportId === r.id).length,
          },
          { key: "description", label: "Description" },
        ]}
        fields={[
          { name: "name", label: "Sport name", required: true },
          {
            name: "category",
            label: "Category",
            type: "select",
            options: opts(["Team", "Individual"]),
            required: true,
          },
          { name: "description", label: "Description", type: "textarea" },
        ]}
      />
      {roster && <Roster team={roster} onClose={() => setRoster(null)} />}
    </div>
  );
}
