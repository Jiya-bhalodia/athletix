import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/ui";
import { useSession } from "@/components/portal/session-context";
import { FeesView, WithPlayer } from "@/components/portal/views";

export const Route = createFileRoute("/player/fees")({ component: Page });

function Page() {
  const s = useSession();
  return (
    <>
      <PageHeader title="Fees" text="Your fee plan and payment history." />
      <WithPlayer playerId={s.linkedId}>{(v) => <FeesView v={v} />}</WithPlayer>
    </>
  );
}
