import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/admin/CrudPage";
import { opts } from "@/components/admin/field-options";
import { StatusBadge } from "@/components/admin/ui";
import { useOptions } from "@/hooks/use-options";
import { useNames } from "@/hooks/use-resource";
import type { Player } from "@/lib/api";

export const Route = createFileRoute("/admin/players")({
  head: () => ({
    meta: [
      { title: "Players — Athletix Admin" },
      { name: "description", content: "Manage player profiles." },
    ],
  }),
  component: Players,
});

function Players() {
  const sports = useOptions("sports"),
    teams = useOptions("teams");
  const sport = useNames("sports"),
    team = useNames("teams");
  return (
    <CrudPage<Player>
      resource="players"
      title="Players"
      singular="Player"
      text="Profiles, contacts, team assignments and player portal access. Players sign in with this profile email and the initial password you set."
      loginAccounts
      searchKeys={["name", "email", "phone"]}
      defaults={{ status: "Active", joinDate: new Date().toISOString().slice(0, 10) }}
      filters={[
        { name: "sportId", label: "Sports", options: sports },
        { name: "teamId", label: "Teams", options: teams },
        { name: "status", label: "Statuses", options: opts(["Active", "Inactive"]) },
      ]}
      columns={[
        {
          key: "name",
          label: "Player",
          csv: (r) => r.name,
          render: (r) => (
            <span className="flex items-center gap-2">
              <span
                className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-xs font-bold"
                aria-hidden
              >
                {r.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
              <span>
                <span className="font-semibold">{r.name}</span>
                <span className="block text-xs text-muted-foreground">{r.email}</span>
              </span>
            </span>
          ),
        },
        { key: "age", label: "Age" },
        {
          key: "sportId",
          label: "Sport",
          render: (r) => sport(r.sportId),
          csv: (r) => sport(r.sportId),
        },
        { key: "teamId", label: "Team", render: (r) => team(r.teamId), csv: (r) => team(r.teamId) },
        { key: "phone", label: "Phone" },
        { key: "joinDate", label: "Joined" },
        {
          key: "emergency",
          label: "Emergency contact",
          render: (r) => `${r.emergencyName} · ${r.emergencyPhone}`,
          csv: (r) => `${r.emergencyName} ${r.emergencyPhone}`,
        },
        { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
        {
          key: "portalAccess",
          label: "Portal access",
          render: (r) => (r.userId ? "Enabled" : "Not set up"),
        },
      ]}
      fields={[
        { name: "name", label: "Full name", required: true },
        { name: "age", label: "Age", type: "number", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone", type: "tel", required: true },
        { name: "sportId", label: "Sport", type: "select", options: sports, required: true },
        { name: "teamId", label: "Team", type: "select", options: teams },
        { name: "joinDate", label: "Joining date", type: "date", required: true },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: opts(["Active", "Inactive"]),
          required: true,
        },
        { name: "emergencyName", label: "Emergency contact name", required: true },
        { name: "emergencyPhone", label: "Emergency contact phone", type: "tel", required: true },
        {
          name: "loginPassword",
          label: "Initial login password (12+ characters)",
          type: "password",
          required: true,
          full: true,
        },
      ]}
    />
  );
}
