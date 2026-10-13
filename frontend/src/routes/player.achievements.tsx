import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/ui";
import { useSession } from "@/components/portal/session-context";
import { AchievementList, WithPlayer } from "@/components/portal/views";

export const Route = createFileRoute("/player/achievements")({ component: Page });

function Page() {
  const s = useSession();
  return (
    <>
      <PageHeader title="Achievements" text="Your trophies, medals, awards and milestones." />
      <WithPlayer playerId={s.linkedId}>{(v) => <AchievementList v={v} />}</WithPlayer>
    </>
  );
}
