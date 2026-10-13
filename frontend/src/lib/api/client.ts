import type { Entity, Fee } from "./types";
import { auth } from "../auth";

const configuredApiUrl = import.meta.env["VITE_API_URL"]?.trim();
const API_URL =
  configuredApiUrl?.replace(/\/$/, "") ??
  (import.meta.env.DEV ? "http://localhost:4000/api/v1" : "");
let csrfToken: string | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ListParams = {
  page?: number;
  limit?: number;
  q?: string;
  filters?: Record<string, string>;
};
type ApiResponse<T> = {
  data: T;
  pagination?: { page: number; limit: number; total: number; pages: number };
};

function queryString(params: ListParams = {}) {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 1));
  search.set("limit", String(params.limit ?? 100));
  if (params.q?.trim()) search.set("q", params.q.trim());
  for (const [key, value] of Object.entries(params.filters ?? {}))
    if (value) search.set(key, value);
  return search.toString();
}

export async function http<R>(path: string, init: RequestInit = {}): Promise<R> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && csrfToken)
    headers.set("X-CSRF-Token", csrfToken);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      method,
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiError(
      "Cannot reach the Athletix API. Check that the backend is running and VITE_API_URL is correct.",
      0,
    );
  }
  if (response.status === 401 && typeof window !== "undefined")
    window.dispatchEvent(new Event("athletix:session-expired"));
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new ApiError(
      body?.error?.message ?? `Request failed (${response.status})`,
      response.status,
      body,
    );
  }
  if (response.status === 204) return undefined as R;
  return (await response.json()) as R;
}

export async function apiData<R>(path: string, init?: RequestInit): Promise<R> {
  return (await http<ApiResponse<R>>(path, init)).data;
}

export type AuthUser = {
  id: string;
  email: string;
  role: "admin" | "coach" | "player" | "parent";
  profileId?: string;
};
export type AuthReply = { user: AuthUser | null; csrfToken: string };
export const authApi = {
  async me() {
    const result = await http<AuthReply>("/auth/me");
    csrfToken = result.csrfToken;
    return result;
  },
  async login(email: string, password: string) {
    await authApi.me();
    const result = await http<AuthReply>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    csrfToken = result.csrfToken;
    return result.user;
  },
  async logout() {
    try {
      await http<void>("/auth/logout", { method: "POST" });
    } finally {
      csrfToken = null;
    }
  },
};

export async function provisionProfileLogin(
  resource: "players" | "parents",
  id: string,
  loginPassword: string,
) {
  return apiData<{ linked: true }>(`/admin/resources/${resource}/${id}/account`, {
    method: "POST",
    body: JSON.stringify({ loginPassword }),
  });
}

export interface Resource<T extends Entity> {
  key: string;
  list(params?: ListParams): Promise<T[]>;
  listPage(
    params?: ListParams,
  ): Promise<{ rows: T[]; pagination?: ApiResponse<T[]>["pagination"] }>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  remove(id: string): Promise<void>;
}

export function normalizeRecord<T>(value: Record<string, unknown>): T {
  const out: Record<string, unknown> = { ...value };
  for (const key of [
    "date",
    "joinDate",
    "dueDate",
    "paidDate",
    "receivedAt",
    "markedAt",
    "paidAt",
    "createdAt",
    "updatedAt",
  ]) {
    if (typeof out[key] === "string" && /^\d{4}-\d{2}-\d{2}T/.test(out[key] as string))
      out[key] = (out[key] as string).slice(0, 10);
  }
  if (typeof out["featured"] === "boolean") out["featured"] = out["featured"] ? "Yes" : "No";
  if (typeof out["published"] === "boolean") out["published"] = out["published"] ? "Yes" : "No";
  if (typeof out["active"] === "boolean") out["active"] = out["active"] ? "Yes" : "No";
  return out as T;
}

function backendBody(key: string, input: Record<string, unknown>) {
  const body = { ...input };
  for (const key of ["teamId", "matchId", "playerId"]) if (body[key] === "") delete body[key];
  if (key === "achievements") {
    if (body["featured"] === "Yes" || body["featured"] === "No")
      body["featured"] = body["featured"] === "Yes";
    delete body["recipient"];
    if (body["recipientType"] === "player") delete body["teamId"];
    if (body["recipientType"] === "team") delete body["playerId"];
  }
  if (key === "announcements" && (body["published"] === "Yes" || body["published"] === "No"))
    body["published"] = body["published"] === "Yes";
  if (
    ["sports", "teams", "feePlans"].includes(key) &&
    (body["active"] === "Yes" || body["active"] === "No")
  )
    body["active"] = body["active"] === "Yes";
  if (key === "fees") {
    delete body["paidDate"];
    delete body["method"];
  }
  return body;
}

export function createResource<T extends Entity>(key: string, _seed: T[]): Resource<T> {
  const path = key === "activities" ? "/admin/activity" : `/admin/resources/${key}`;
  const coachTeams = new Map<string, string>();
  const coachPlayerTeams = new Map<string, string>();
  const coachTeamIds = async () =>
    (await apiData<Record<string, unknown>[]>("/coach/teams")).map((row) => String(row["id"]));
  const coachList = async (): Promise<T[]> => {
    if (key === "coaches") return [];
    if (key === "sports") return (await publicApi.sports()) as T[];
    if (key === "teams") return (await apiData<Record<string, unknown>[]>("/coach/teams")) as T[];
    const teams = await coachTeamIds();
    if (key === "players") {
      const lists = await Promise.all(
        teams.map(async (teamId) => {
          const rows = await apiData<Record<string, unknown>[]>(
            `/coach/teams/${teamId}/players?limit=100`,
          );
          rows.forEach((row) => coachPlayerTeams.set(String(row["id"]), teamId));
          return rows;
        }),
      );
      return lists.flat().map((row) => normalizeRecord<T>(row));
    }
    if (key === "sessions" || key === "matches" || key === "performance") {
      const lists = await Promise.all(
        teams.map(async (teamId) => {
          if (key === "performance") {
            const [rows, players] = await Promise.all([
              apiData<Record<string, unknown>[]>(`/coach/teams/${teamId}/performance?limit=100`),
              apiData<Record<string, unknown>[]>(`/coach/teams/${teamId}/players?limit=100`),
            ]);
            players.forEach((player) => coachPlayerTeams.set(String(player["id"]), teamId));
            return rows;
          }
          return apiData<Record<string, unknown>[]>(`/coach/teams/${teamId}/${key}?limit=100`);
        }),
      );
      return lists.flat().map((row) => {
        coachTeams.set(String(row["id"]), String(row["teamId"] ?? teams[0]));
        return normalizeRecord<T>(row);
      });
    }
    if (key === "attendance") {
      const sessions: (Record<string, unknown> & { teamId: string })[] = (
        await Promise.all(
          teams.map((id) =>
            apiData<Record<string, unknown>[]>(`/coach/teams/${id}/sessions?limit=100`).then(
              (rows) => rows.map((row) => ({ ...row, teamId: id })),
            ),
          ),
        )
      ).flat();
      const data = await Promise.all(
        sessions.map(async (row) => {
          const result = await apiData<{ attendance: Record<string, unknown>[] }>(
            `/coach/teams/${row.teamId}/sessions/${String(row["id"])}/attendance`,
          );
          return result.attendance;
        }),
      );
      return data.flat().map((row) => normalizeRecord<T>(row));
    }
    throw new ApiError("This feature is available to academy administrators only.", 403);
  };
  return {
    key,
    async list(params) {
      return (await this.listPage(params)).rows;
    },
    async listPage(params) {
      if (auth.get()?.role === "Coach") return { rows: await coachList() };
      const result = await http<ApiResponse<Record<string, unknown>[]>>(
        `${path}?${queryString(params)}`,
      );
      return {
        rows: result.data.map((row) => normalizeRecord<T>(row)),
        ...(result.pagination ? { pagination: result.pagination } : {}),
      };
    },
    async create(data) {
      if (auth.get()?.role === "Coach") {
        const input = data as Record<string, unknown>;
        if (key === "sessions" || key === "matches") {
          const teamId = String(input["teamId"] ?? "");
          const body = { ...input };
          delete body["teamId"];
          delete body["coachId"];
          const result = await apiData<Record<string, unknown>>(`/coach/teams/${teamId}/${key}`, {
            method: "POST",
            body: JSON.stringify(body),
          });
          coachTeams.set(String(result["id"]), teamId);
          return normalizeRecord<T>(result);
        }
        if (key === "performance") {
          const playerId = String(input["playerId"] ?? "");
          const teamId = coachPlayerTeams.get(playerId);
          if (!teamId) throw new ApiError("Reload the player list before adding feedback.", 404);
          const body = { ...input };
          delete body["teamId"];
          const result = await apiData<Record<string, unknown>>(
            `/coach/teams/${teamId}/performance`,
            { method: "POST", body: JSON.stringify(body) },
          );
          return normalizeRecord<T>(result);
        }
        throw new ApiError("This feature is read-only or administrator-only for coaches.", 403);
      }
      const result = await apiData<Record<string, unknown>>(path, {
        method: "POST",
        body: JSON.stringify(backendBody(key, data as Record<string, unknown>)),
      });
      return normalizeRecord<T>(result);
    },
    async update(id, data) {
      if (auth.get()?.role === "Coach" && (key === "sessions" || key === "matches")) {
        const teamId = coachTeams.get(id);
        if (!teamId) throw new ApiError("Reload the team record before editing.", 404);
        const body = { ...(data as Record<string, unknown>) };
        delete body["teamId"];
        delete body["coachId"];
        return normalizeRecord<T>(
          await apiData<Record<string, unknown>>(`/coach/teams/${teamId}/${key}/${id}`, {
            method: "PATCH",
            body: JSON.stringify(body),
          }),
        );
      }
      if (auth.get()?.role === "Coach")
        throw new ApiError("This feature is read-only or administrator-only for coaches.", 403);
      const result = await apiData<Record<string, unknown>>(`${path}/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(backendBody(key, data as Record<string, unknown>)),
      });
      return normalizeRecord<T>(result);
    },
    async remove(id) {
      if (auth.get()?.role === "Coach" && (key === "sessions" || key === "matches")) {
        const teamId = coachTeams.get(id);
        if (!teamId) throw new ApiError("Reload the team record before removing it.", 404);
        await http<void>(`/coach/teams/${teamId}/${key}/${id}`, { method: "DELETE" });
        return;
      }
      if (auth.get()?.role === "Coach")
        throw new ApiError("This feature is read-only or administrator-only for coaches.", 403);
      await http<void>(`${path}/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  };
}

export const publicApi = {
  sports: async () =>
    (
      await http<ApiResponse<Record<string, unknown>[]>>(
        `/public/sports?${queryString({ limit: 100 })}`,
      )
    ).data.map((row) => normalizeRecord(row)),
  achievements: async () =>
    (
      await http<ApiResponse<Record<string, unknown>[]>>(
        `/public/achievements?${queryString({ limit: 100 })}`,
      )
    ).data.map((row) => normalizeRecord(row)),
  announcements: async () =>
    (
      await http<ApiResponse<Record<string, unknown>[]>>(
        `/public/announcements?${queryString({ limit: 100 })}`,
      )
    ).data.map((row) => normalizeRecord(row)),
  enrollment: async (data: {
    name: string;
    email: string;
    phone: string;
    sport: string;
    message?: string;
  }) =>
    apiData<{ id: string; status: string; receivedAt: string }>("/public/enrollment-inquiries", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const paymentApi = {
  async record(
    feeId: string,
    data: { amount: number; method: string; currency?: string; paidAt?: string },
  ) {
    return apiData<Record<string, unknown>>(`/fees/${encodeURIComponent(feeId)}/payments`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async playerHistory() {
    return apiData<Record<string, unknown>[]>("/portal/player/payments");
  },
  async parentHistory(childId: string) {
    return apiData<Record<string, unknown>[]>(
      `/portal/parent/children/${encodeURIComponent(childId)}/payments`,
    );
  },
  async adminHistory() {
    return apiData<Record<string, unknown>[]>("/payments");
  },
};

export const feeApi = {
  create(data: {
    playerId: string;
    planId: string;
    amount: number;
    paidAmount: number;
    paidAt?: string;
    method?: string;
    dueDate: string;
  }) {
    return apiData<Fee>("/admin/resources/fees", { method: "POST", body: JSON.stringify(data) });
  },
};

export const reportApi = {
  async dashboard() {
    return apiData<Record<string, number>>("/reports/dashboard");
  },
  async attendanceCsv() {
    return http<string>("/reports/attendance.csv");
  },
};
