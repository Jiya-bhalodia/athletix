import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/ui";
import { useSession } from "@/components/portal/session-context";
import { PerformanceView, WithPlayer } from "@/components/portal/views";

export const Route = createFileRoute("/player/performance")({ component: Page });

function Page() {
  const s = useSession();
  return (
    <>
      <PageHeader title="Performance" text="Your ratings and coach feedback over time." />
      <WithPlayer playerId={s.linkedId}>{(v) => <PerformanceView v={v} who="You" />}</WithPlayer>
    </>
  );
}
