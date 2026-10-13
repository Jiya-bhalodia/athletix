import { createFileRoute } from "@tanstack/react-router";
import { Panel } from "@/components/admin/ui";
import { ParentPage } from "@/components/portal/ParentPage";
import { ProfileSummary, ReadOnlyNote } from "@/components/portal/views";

export const Route = createFileRoute("/parent/children")({ component: Page });

function Page() {
  return (
    <ParentPage title="Child profile" text={(n) => `${n}'s academy details.`}>
      {(v) => (
        <div className="grid gap-4 lg:grid-cols-2">
          <ProfileSummary v={v} />
          <Panel title="Contact & coach">
            <ReadOnlyNote text="To change these details, please contact the academy office." />
            <dl className="space-y-2 text-sm">
              {[
                ["Email", v.player.email],
                ["Phone", v.player.phone],
                ["Emergency contact", `${v.player.emergencyName} · ${v.player.emergencyPhone}`],
                ["Coach", v.coach ? `${v.coach.name} · ${v.coach.phone}` : "—"],
                ["Coach schedule", v.coach?.schedule ?? "—"],
                ["Age group", v.team?.ageGroup ?? "—"],
              ].map(([k, val]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium">{val}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      )}
    </ParentPage>
  );
}
