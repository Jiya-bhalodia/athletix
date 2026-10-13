import { createFileRoute, Link } from "@tanstack/react-router";
import { Panel } from "@/components/admin/ui";
import { ParentPage } from "@/components/portal/ParentPage";
import { useSession } from "@/components/portal/session-context";
import {
  AchievementList,
  AnnouncementsPanel,
  ProfileSummary,
  SummaryStats,
  UpcomingPanel,
} from "@/components/portal/views";
import { fmt, inr } from "@/components/portal/view-formatters";

export const Route = createFileRoute("/parent/")({ component: ParentHome });

function ParentHome() {
  const s = useSession();
  return (
    <ParentPage
      title={`Hello ${s.name.split(" ")[0]}`}
      text={(n) => `Here's how ${n} is getting on at the academy.`}
    >
      {(v) => {
        const due = v.fees
          .filter((f) => f.status !== "Paid")
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
        return (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4">
              <ProfileSummary v={v} />
              <Panel
                title="Fee reminder"
                action={
                  <Link to="/parent/fees" className="text-xs font-semibold hover:text-highlight">
                    Details
                  </Link>
                }
              >
                {due ? (
                  <p className="text-sm">
                    <span className="text-xl font-bold">{inr(v.outstanding)}</span> outstanding ·
                    next due {fmt(due.dueDate)}{" "}
                    <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold">
                      {due.status}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">All fees are paid. Thank you!</p>
                )}
              </Panel>
            </div>
            <div className="space-y-4 lg:col-span-2">
              <SummaryStats v={v} />
              <UpcomingPanel v={v} trainingTo="/parent/attendance" matchesTo="/parent/progress" />
              <div className="grid gap-4 md:grid-cols-2">
                <AnnouncementsPanel v={v} />
                <Panel
                  title="Recent achievements"
                  action={
                    <Link
                      to="/parent/achievements"
                      className="text-xs font-semibold hover:text-highlight"
                    >
                      View all
                    </Link>
                  }
                >
                  <AchievementList v={v} limit={3} />
                </Panel>
              </div>
            </div>
          </div>
        );
      }}
    </ParentPage>
  );
}
