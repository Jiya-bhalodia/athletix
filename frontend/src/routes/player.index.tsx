import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PageHeader, Panel } from "@/components/admin/ui";
import { useSession } from "@/components/portal/session-context";
import {
  AchievementList,
  AnnouncementsPanel,
  PerformanceView,
  ProfileSummary,
  SummaryStats,
  UpcomingPanel,
  WithPlayer,
} from "@/components/portal/views";

export const Route = createFileRoute("/player/")({ component: PlayerHome });

const links = [
  { to: "/player/training", label: "Check my training schedule" },
  { to: "/player/performance", label: "See my progress" },
  { to: "/player/profile", label: "Update my contact details" },
] as const;

function PlayerHome() {
  const s = useSession();
  return (
    <WithPlayer playerId={s.linkedId}>
      {(v) => (
        <>
          <PageHeader
            title={`Hi ${v.player.name.split(" ")[0]}, welcome back`}
            text={`Here's what's happening with ${v.team?.name ?? "your team"} this week.`}
          />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4">
              <ProfileSummary v={v} />
              <Panel title="Next steps">
                <ul className="space-y-1">
                  {links.map((l) => (
                    <li key={l.to}>
                      <Link
                        to={l.to}
                        className="flex items-center justify-between rounded-md px-2 py-2 text-sm font-medium hover:bg-secondary"
                      >
                        {l.label}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
            <div className="space-y-4 lg:col-span-2">
              <UpcomingPanel v={v} trainingTo="/player/training" matchesTo="/player/matches" />
              <SummaryStats v={v} />
              <div className="grid gap-4 md:grid-cols-2">
                <AnnouncementsPanel v={v} />
                <Panel
                  title="Recent achievements"
                  action={
                    <Link
                      to="/player/achievements"
                      className="text-xs font-semibold hover:text-highlight"
                    >
                      View all
                    </Link>
                  }
                >
                  <AchievementList v={v} limit={3} />
                </Panel>
              </div>
              <PerformanceView v={v} who="You" />
            </div>
          </div>
        </>
      )}
    </WithPlayer>
  );
}
