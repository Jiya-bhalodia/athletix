import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/admin/CrudPage";
import { opts } from "@/components/admin/field-options";
import { StatusBadge } from "@/components/admin/ui";
import { useOptions } from "@/hooks/use-options";
import { useNames } from "@/hooks/use-resource";
import type { Match } from "@/lib/api";
import { resultOf } from "./-match-utils";

export const Route = createFileRoute("/admin/matches")({
  head: () => ({
    meta: [
      { title: "Matches — Athletix Admin" },
      { name: "description", content: "Schedule fixtures and record results." },
    ],
  }),
  component: Matches,
});

function Matches() {
  const teams = useOptions("teams");
  const team = useNames("teams");
  return (
    <CrudPage<Match>
      resource="matches"
      title="Matches & tournaments"
      singular="Match"
      text="Fixtures, venues, scores and results."
      searchKeys={["opponent", "tournament", "venue"]}
      defaults={{ status: "Upcoming" }}
      filters={[
        { name: "teamId", label: "Teams", options: teams },
        { name: "status", label: "Statuses", options: opts(["Upcoming", "Completed"]) },
      ]}
      columns={[
        { key: "date", label: "Date" },
        {
          key: "teamId",
          label: "Team",
          render: (r) => <span className="font-semibold">{team(r.teamId)}</span>,
          csv: (r) => team(r.teamId),
        },
        { key: "opponent", label: "Opponent" },
        { key: "tournament", label: "Tournament" },
        { key: "venue", label: "Venue" },
        {
          key: "score",
          label: "Score",
          render: (r) => (r.ourScore == null ? "—" : `${r.ourScore} – ${r.theirScore}`),
          csv: (r) => (r.ourScore == null ? "" : `${r.ourScore}-${r.theirScore}`),
        },
        {
          key: "result",
          label: "Result",
          render: (r) => (resultOf(r) === "—" ? "—" : <StatusBadge value={resultOf(r)} />),
          csv: resultOf,
        },
        { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
      ]}
      fields={[
        { name: "teamId", label: "Team", type: "select", options: teams, required: true },
        { name: "opponent", label: "Opponent", required: true },
        { name: "date", label: "Date", type: "date", required: true },
        { name: "venue", label: "Venue", required: true },
        { name: "tournament", label: "Tournament / competition", required: true },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: opts(["Upcoming", "Completed"]),
          required: true,
        },
        { name: "ourScore", label: "Our score", type: "number" },
        { name: "theirScore", label: "Opponent score", type: "number" },
      ]}
    />
  );
}
