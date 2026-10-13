import { createFileRoute } from "@tanstack/react-router";
import { ParentPage } from "@/components/portal/ParentPage";
import { PerformanceView, MatchesView } from "@/components/portal/views";

export const Route = createFileRoute("/parent/progress")({ component: Page });

function Page() {
  return (
    <ParentPage title="Matches & progress" text={(n) => `How ${n} is developing, match by match.`}>
      {(v) => (
        <div className="space-y-4">
          <PerformanceView v={v} who="Parents" />
          <MatchesView v={v} />
        </div>
      )}
    </ParentPage>
  );
}
