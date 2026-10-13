import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/ui";
import { useSession } from "@/components/portal/session-context";
import { MatchesView, WithPlayer } from "@/components/portal/views";

export const Route = createFileRoute("/player/matches")({ component: Page });

function Page() {
  const s = useSession();
  return (
    <>
      <PageHeader title="Matches" text="Upcoming fixtures and previous results." />
      <WithPlayer playerId={s.linkedId}>{(v) => <MatchesView v={v} />}</WithPlayer>
    </>
  );
}
