import { createFileRoute } from "@tanstack/react-router";
import { ParentPage } from "@/components/portal/ParentPage";
import { FeesView } from "@/components/portal/views";

export const Route = createFileRoute("/parent/fees")({ component: Page });

function Page() {
  return (
    <ParentPage title="Fees & payments" text={(n) => `Fee plan and payment history for ${n}.`}>
      {(v) => <FeesView v={v} />}
    </ParentPage>
  );
}
