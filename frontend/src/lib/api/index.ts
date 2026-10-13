import { createResource } from "./client";
import { apiData } from "./client";
import type * as T from "./types";

export * from "./types";

export const activityApi = createResource<T.Activity>("activities", []);

export const api = {
  sports: createResource<T.Sport>("sports", []),
  coaches: createResource<T.Coach>("coaches", []),
  teams: createResource<T.Team>("teams", []),
  players: createResource<T.Player>("players", []),
  sessions: createResource<T.Session>("sessions", []),
  attendance: createResource<T.Attendance>("attendance", []),
  matches: createResource<T.Match>("matches", []),
  performance: createResource<T.Performance>("performance", []),
  achievements: createResource<T.Achievement>("achievements", []),
  feePlans: createResource<T.FeePlan>("feePlans", []),
  fees: createResource<T.Fee>("fees", []),
  announcements: createResource<T.Announcement>("announcements", []),
  parents: createResource<T.Parent>("parents", []),
  activities: activityApi,
};
export type ApiKey = keyof typeof api;
export const coachApi = {
  async attendance(
    teamId: string,
    sessionId: string,
    records: { playerId: string; status: string }[],
  ) {
    return apiData<Record<string, unknown>[]>(
      `/coach/teams/${teamId}/sessions/${sessionId}/attendance`,
      { method: "PUT", body: JSON.stringify({ records }) },
    );
  },
};
