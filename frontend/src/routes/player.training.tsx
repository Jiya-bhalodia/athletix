import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/ui";
import { useSession } from "@/components/portal/session-context";
import { TrainingView, WithPlayer } from "@/components/portal/views";

export const Route = createFileRoute("/player/training")({ component: Page });

function Page() {
  const s = useSession();
  return (
    <>
      <PageHeader title="Training & attendance" text="Your sessions and attendance record." />
      <WithPlayer playerId={s.linkedId}>{(v) => <TrainingView v={v} who="You" />}</WithPlayer>
    </>
  );
}
