import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/admin/CrudPage";
import { opts } from "@/components/admin/field-options";
import { StatusBadge } from "@/components/admin/ui";
import { useOptions } from "@/hooks/use-options";
import { useNames } from "@/hooks/use-resource";
import type { Achievement } from "@/lib/api";

export const Route = createFileRoute("/admin/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements — Athletix Admin" },
      { name: "description", content: "Hall of fame: awards, medals and milestones." },
    ],
  }),
  component: Achievements,
});

const types = ["Trophy", "Medal", "Award", "Milestone"] as const;

function Achievements() {
  const sports = useOptions("sports"),
    players = useOptions("players"),
    teams = useOptions("teams");
  const sport = useNames("sports");
  const player = useNames("players"),
    team = useNames("teams");
  return (
    <CrudPage<Achievement>
      resource="achievements"
      title="Achievements & hall of fame"
      singular="Achievement"
      text="Featured entries are the ones intended for the public Achievements page."
      searchKeys={["title", "description"]}
      defaults={{ type: "Trophy", featured: "No", recipientType: "player" }}
      filters={[
        { name: "type", label: "Types", options: opts(types) },
        { name: "sportId", label: "Sports", options: sports },
        { name: "featured", label: "Featured", options: opts(["Yes", "No"]) },
      ]}
      columns={[
        {
          key: "title",
          label: "Achievement",
          render: (r) => (
            <span>
              <span className="font-semibold">{r.title}</span>
              <span className="block text-xs text-muted-foreground">{r.description}</span>
            </span>
          ),
          csv: (r) => r.title,
        },
        { key: "type", label: "Type" },
        {
          key: "recipient",
          label: "Player / team",
          render: (r) =>
            r.recipientType === "player" ? player(r.playerId ?? "") : team(r.teamId ?? ""),
        },
        {
          key: "sportId",
          label: "Sport",
          render: (r) => sport(r.sportId),
          csv: (r) => sport(r.sportId),
        },
        { key: "date", label: "Date" },
        { key: "featured", label: "Featured", render: (r) => <StatusBadge value={r.featured} /> },
      ]}
      fields={[
        { name: "title", label: "Title", required: true, full: true },
        { name: "type", label: "Type", type: "select", options: opts(types), required: true },
        {
          name: "recipientType",
          label: "Recipient type",
          type: "select",
          options: opts(["player", "team"]),
          required: true,
        },
        { name: "playerId", label: "Player recipient", type: "select", options: players },
        { name: "teamId", label: "Team recipient", type: "select", options: teams },
        { name: "sportId", label: "Sport", type: "select", options: sports, required: true },
        { name: "date", label: "Date", type: "date", required: true },
        {
          name: "featured",
          label: "Feature on public site",
          type: "select",
          options: opts(["Yes", "No"]),
          required: true,
        },
        { name: "description", label: "Description", type: "textarea" },
      ]}
    />
  );
}
