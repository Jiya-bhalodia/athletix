import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, authApi, http } from "./client";
import { api } from "./index";
import { auth } from "../auth";

afterEach(() => {
  vi.unstubAllGlobals();
  auth.clear();
});

describe("API client", () => {
  it("uses credentialed requests and obtains a CSRF token before login", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ user: null, csrfToken: "csrf-test" }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user: { id: "u1", email: "coach@example.test", role: "coach" },
            csrfToken: "csrf-next",
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const user = await authApi.login("coach@example.test", "password");

    expect(user?.role).toBe("coach");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ credentials: "include", method: "GET" });
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ credentials: "include", method: "POST" });
    expect(new Headers(fetchMock.mock.calls[1]?.[1]?.headers).get("X-CSRF-Token")).toBe(
      "csrf-test",
    );
  });

  it("surfaces API failures as typed errors instead of hiding them", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { message: "Validation failed" } }), {
          status: 422,
        }),
      ),
    );
    await expect(http("/test")).rejects.toMatchObject({
      status: 422,
      message: "Validation failed",
    });
  });

  it("creates coach feedback through the assigned team endpoint without sending teamId in the body", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ user: null, csrfToken: "csrf-before" }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user: { id: "u1", email: "coach@example.test", role: "coach" },
            csrfToken: "csrf-coach",
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ id: "team-1" }] }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ id: "player-1", teamId: "team-1" }] }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: { id: "feedback-1", playerId: "player-1", rating: 8, notes: "Good effort" },
          }),
          { status: 201 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    await auth.signIn("coach@example.test", "password");
    await api.performance.list();
    await api.performance.create({
      playerId: "player-1",
      teamId: "team-1",
      rating: 8,
      notes: "Good effort",
    });

    const [url, request] = fetchMock.mock.calls[5] as [string, RequestInit];
    expect(url).toContain("/coach/teams/team-1/performance");
    expect(JSON.parse(String(request.body))).toEqual({
      playerId: "player-1",
      rating: 8,
      notes: "Good effort",
    });
  });
});
