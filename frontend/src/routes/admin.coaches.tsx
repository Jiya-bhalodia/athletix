import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/admin/CrudPage";
import { opts } from "@/components/admin/field-options";
import { StatusBadge } from "@/components/admin/ui";
import { useOptions } from "@/hooks/use-options";
import { useList, useNames } from "@/hooks/use-resource";
import type { Coach } from "@/lib/api";

export const Route = createFileRoute("/admin/coaches")({
  head: () => ({
    meta: [
      { title: "Coaches — Athletix Admin" },
      { name: "description", content: "Manage coach profiles and schedules." },
    ],
  }),
  component: Coaches,
});

function Coaches() {
  const sports = useOptions("sports");
  const sport = useNames("sports");
  const teams = useList("teams");
  const teamsOf = (id: string) =>
    teams
      .filter((t) => t.coachId === id)
      .map((t) => t.name)
      .join(", ") || "—";
  return (
    <CrudPage<Coach>
      resource="coaches"
      title="Coaches"
      singular="Coach"
      text="Coach profiles, sports, teams and training schedules."
      searchKeys={["name", "email"]}
      defaults={{ status: "Active" }}
      filters={[
        { name: "sportId", label: "Sports", options: sports },
        { name: "status", label: "Statuses", options: opts(["Active", "On leave"]) },
      ]}
      columns={[
        {
          key: "name",
          label: "Coach",
          render: (r) => (
            <span>
              <span className="font-semibold">{r.name}</span>
              <span className="block text-xs text-muted-foreground">
                {r.email} · {r.phone}
              </span>
            </span>
          ),
          csv: (r) => r.name,
        },
        {
          key: "sportId",
          label: "Sport",
          render: (r) => sport(r.sportId),
          csv: (r) => sport(r.sportId),
        },
        { key: "teams", label: "Teams", render: (r) => teamsOf(r.id), csv: (r) => teamsOf(r.id) },
        { key: "experience", label: "Experience", render: (r) => `${r.experience} yrs` },
        { key: "schedule", label: "Schedule" },
        { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
      ]}
      fields={[
        { name: "name", label: "Full name", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone", type: "tel", required: true },
        {
          name: "sportId",
          label: "Assigned sport",
          type: "select",
          options: sports,
          required: true,
        },
        { name: "experience", label: "Experience (years)", type: "number" },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: opts(["Active", "On leave"]),
          required: true,
        },
        { name: "schedule", label: "Training schedule", full: true, required: true },
      ]}
    />
  );
}
