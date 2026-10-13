import { createFileRoute } from "@tanstack/react-router";
import { ParentPage } from "@/components/portal/ParentPage";
import { TrainingView } from "@/components/portal/views";

export const Route = createFileRoute("/parent/attendance")({ component: Page });

function Page() {
  return (
    <ParentPage
      title="Training & attendance"
      text={(n) => `Training schedule and attendance for ${n}.`}
    >
      {(v) => <TrainingView v={v} who="Parents" />}
    </ParentPage>
  );
}
