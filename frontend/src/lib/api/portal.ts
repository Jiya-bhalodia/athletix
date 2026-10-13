// Portal read models are assembled only from the authenticated, server-scoped portal endpoints.
import { apiData, publicApi, normalizeRecord } from "./client";
import type { Role } from "../auth";
import type * as T from "./types";

export type AllData = {
  players: T.Player[];
  teams: T.Team[];
  coaches: T.Coach[];
  sports: T.Sport[];
  sessions: T.Session[];
  attendance: T.Attendance[];
  matches: T.Match[];
  performance: T.Performance[];
  achievements: T.Achievement[];
  feePlans: T.FeePlan[];
  fees: T.Fee[];
  announcements: T.Announcement[];
  payments: T.Payment[];
};

export type PlayerView = ReturnType<typeof selectPlayerView>;

export function selectPlayerView(all: AllData, playerId: string, today: string) {
  const player = all.players.find((p) => p.id === playerId);
  if (!player) return null;
  const team = all.teams.find((t) => t.id === player.teamId);
  const coach = all.coaches.find((c) => c.id === team?.coachId);
  const sport = all.sports.find((s) => s.id === player.sportId);
  const teamSessions = all.sessions
    .filter((s) => s.teamId === player.teamId)
    .sort((a, b) => a.date.localeCompare(b.date));
  const upcomingSessions = teamSessions.filter((s) => s.date >= today);
  const attendance = all.attendance
    .filter((a) => a.playerId === playerId)
    .map((a) => ({ ...a, session: all.sessions.find((s) => s.id === a.sessionId) }))
    .filter((a) => a.session)
    .sort((a, b) => b.session!.date.localeCompare(a.session!.date));
  const present = attendance.filter((a) => a.status === "Present").length;
  const attendancePct = attendance.length ? Math.round((present / attendance.length) * 100) : null;
  const teamMatches = all.matches.filter((m) => m.teamId === player.teamId);
  const upcomingMatches = teamMatches
    .filter((m) => m.status === "Upcoming")
    .sort((a, b) => a.date.localeCompare(b.date));
  const pastMatches = teamMatches
    .filter((m) => m.status === "Completed")
    .sort((a, b) => b.date.localeCompare(a.date));
  const scoredMatches = pastMatches.filter((m) => m.ourScore !== null && m.theirScore !== null);
  const matchRecord = {
    played: scoredMatches.length,
    won: scoredMatches.filter((m) => m.ourScore! > m.theirScore!).length,
    drawn: scoredMatches.filter((m) => m.ourScore === m.theirScore).length,
    lost: scoredMatches.filter((m) => m.ourScore! < m.theirScore!).length,
    scoreFor: scoredMatches.reduce((sum, m) => sum + m.ourScore!, 0),
    scoreAgainst: scoredMatches.reduce((sum, m) => sum + m.theirScore!, 0),
  };
  const performance = all.performance
    .filter((p) => p.playerId === playerId)
    .map((p) => ({ ...p, match: all.matches.find((m) => m.id === p.matchId) }))
    .sort((a, b) =>
      (a.match?.date ?? a.createdAt ?? "").localeCompare(b.match?.date ?? b.createdAt ?? ""),
    );
  const avgRating = performance.length
    ? +(performance.reduce((s, p) => s + p.rating, 0) / performance.length).toFixed(1)
    : null;
  const achievements = all.achievements
    .filter((a) => a.recipient === player.name || a.recipient === team?.name)
    .sort((a, b) => b.date.localeCompare(a.date));
  const fees = all.fees
    .filter((f) => f.playerId === playerId)
    .map((f) => ({ ...f, plan: all.feePlans.find((p) => p.id === f.planId) }))
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  const totalFees = fees.reduce((s, f) => s + f.amount, 0);
  const paid = fees.reduce((s, f) => s + (f.paidAmount ?? (f.status === "Paid" ? f.amount : 0)), 0);
  const outstanding = fees.reduce(
    (s, f) =>
      s +
      (f.pendingAmount ??
        Math.max(0, f.amount - (f.paidAmount ?? (f.status === "Paid" ? f.amount : 0)))),
    0,
  );
  const announcements = all.announcements
    .filter((a) => a.published === "Yes")
    .sort((a, b) => b.date.localeCompare(a.date));
  return {
    player,
    team,
    coach,
    sport,
    upcomingSessions,
    attendance,
    attendancePct,
    upcomingMatches,
    pastMatches,
    matchRecord,
    performance,
    avgRating,
    achievements,
    fees,
    totalFees,
    paid,
    outstanding,
    announcements,
    payments: all.payments,
  };
}

/** Service methods (backend-ready). */
export const portalService = {
  async parentChildren(_parentId: string): Promise<T.Player[]> {
    const rows = await apiData<Record<string, unknown>[]>("/portal/parent/children");
    return rows.map((row) => {
      const sport = row["sportId"] as Record<string, unknown> | string | undefined;
      const team = row["teamId"] as Record<string, unknown> | string | undefined;
      return normalizeRecord<T.Player>({ ...row, sportId: refId(sport), teamId: refId(team) });
    });
  },
  async playerView(playerId: string, role: Role): Promise<PlayerView> {
    const path =
      role === "Parent"
        ? `/portal/parent/children/${encodeURIComponent(playerId)}`
        : "/portal/player";
    const snapshot = await apiData<Record<string, unknown>>(path);
    const announcements = await publicApi.announcements();
    const rawPlayer = snapshot["player"] as Record<string, unknown> | undefined;
    if (!rawPlayer) return null;
    const rawSport = rawPlayer["sportId"] as Record<string, unknown> | string | undefined;
    const rawTeam = rawPlayer["teamId"] as Record<string, unknown> | string | undefined;
    const player = normalizeRecord<T.Player>({
      ...rawPlayer,
      sportId: refId(rawSport),
      teamId: refId(rawTeam) || "",
    });
    const rawCoach =
      rawTeam && typeof rawTeam === "object"
        ? (rawTeam["coachId"] as Record<string, unknown> | undefined)
        : undefined;
    const team =
      rawTeam && typeof rawTeam === "object"
        ? normalizeRecord<T.Team>({ ...rawTeam, sportId: player.sportId, coachId: refId(rawCoach) })
        : undefined;
    const coach = rawCoach
      ? normalizeRecord<T.Coach>({ ...rawCoach, sportId: player.sportId })
      : undefined;
    const sport =
      rawSport && typeof rawSport === "object" ? normalizeRecord<T.Sport>(rawSport) : undefined;
    const sessions = records<T.Session>(snapshot["sessions"]);
    const matches = records<T.Match>(snapshot["matches"]);
    const attendance = records<T.Attendance>(snapshot["attendance"]);
    const performance = records<T.Performance>(snapshot["performance"]);
    const rawAchievements = Array.isArray(snapshot["achievements"])
      ? (snapshot["achievements"] as Record<string, unknown>[])
      : [];
    const achievements = rawAchievements.map((a) => {
      const aPlayer = a["playerId"] as Record<string, unknown> | undefined;
      const aTeam = a["teamId"] as Record<string, unknown> | undefined;
      return normalizeRecord<T.Achievement>({
        ...a,
        recipient: aPlayer?.["name"] ?? aTeam?.["name"] ?? "",
        sportId: refId(a["sportId"] as Record<string, unknown> | string | undefined),
        featured: a["featured"] ? "Yes" : "No",
      });
    });
    const rawFees = Array.isArray(snapshot["fees"])
      ? (snapshot["fees"] as Record<string, unknown>[])
      : [];
    const feePlans: T.FeePlan[] = [];
    const payments: T.Payment[] = (
      Array.isArray(snapshot["payments"]) ? (snapshot["payments"] as Record<string, unknown>[]) : []
    ).map((payment) => normalizeRecord<T.Payment>(payment));
    const fees = rawFees.map((fee) => {
      const plan = fee["planId"] as Record<string, unknown> | undefined;
      const planId = refId(plan);
      if (plan)
        feePlans.push(
          normalizeRecord<T.FeePlan>({ ...plan, sportId: player.sportId, amount: fee["amount"] }),
        );
      const feePayments = payments.filter(
        (payment) => payment.feeRecordId === String(fee["id"]) && payment.status === "Succeeded",
      );
      const latest = [...feePayments].sort((a, b) => b.paidAt.localeCompare(a.paidAt))[0];
      const paidAmount = Number(
        fee["paidAmount"] ?? feePayments.reduce((total, payment) => total + payment.amount, 0),
      );
      const pendingAmount = Math.max(0, Number(fee["amount"]) - paidAmount);
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const status =
        pendingAmount === 0
          ? "Paid"
          : new Date(fee["dueDate"] as string).getTime() < today.getTime()
            ? "Overdue"
            : "Pending";
      return normalizeRecord<T.Fee>({
        ...fee,
        playerId: player.id,
        planId,
        paidDate: latest?.paidAt ?? "",
        method: latest?.method ?? "",
        paidAmount,
        pendingAmount,
        status,
      });
    });
    const all: AllData = {
      players: [player],
      teams: team ? [team] : [],
      coaches: coach ? [coach] : [],
      sports: sport ? [sport] : [],
      sessions,
      matches,
      attendance,
      performance,
      achievements,
      feePlans,
      fees,
      announcements: announcements as T.Announcement[],
      payments,
    };
    return selectPlayerView(all, player.id, new Date().toISOString().slice(0, 10));
  },
  async updatePlayerProfile(
    data: Pick<T.Player, "email" | "phone" | "emergencyName" | "emergencyPhone">,
  ) {
    return apiData<Record<string, unknown>>("/portal/player/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

function refId(value: Record<string, unknown> | string | undefined): string {
  if (typeof value === "string") return value;
  if (!value) return "";
  return String(value["id"] ?? value["_id"] ?? "");
}
function records<T>(value: unknown): T[] {
  return Array.isArray(value)
    ? value.map((row) => normalizeRecord<T>(row as Record<string, unknown>))
    : [];
}
