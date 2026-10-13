import { createFileRoute } from "@tanstack/react-router";
import { ParentPage } from "@/components/portal/ParentPage";
import { AchievementList } from "@/components/portal/views";

export const Route = createFileRoute("/parent/achievements")({ component: Page });

function Page() {
  return (
    <ParentPage title="Achievements" text={(n) => `Awards, medals and milestones earned by ${n}.`}>
      {(v) => <AchievementList v={v} />}
    </ParentPage>
  );
}
