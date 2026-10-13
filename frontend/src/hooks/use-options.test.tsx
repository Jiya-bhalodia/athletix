import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useOptions } from "./use-options";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

afterEach(() => vi.unstubAllGlobals());

describe("useOptions", () => {
  it("shows server records as selectable options after loading", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: [{ id: "sport-1", name: "Football" }],
            pagination: { page: 1, limit: 100, total: 1, pages: 1 },
          }),
          { status: 200 },
        ),
      ),
    );
    const { result } = renderHook(() => useOptions("sports"), { wrapper });
    await waitFor(() => expect(result.current).toEqual([{ value: "sport-1", label: "Football" }]));
  });

  it("explains when a required list has no records", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ data: [], pagination: { page: 1, limit: 100, total: 0, pages: 0 } }),
            { status: 200 },
          ),
        ),
    );
    const { result } = renderHook(() => useOptions("sports"), { wrapper });
    await waitFor(() => expect(result.current[0]?.label).toContain("No sports yet"));
    expect(result.current[0]?.disabled).toBe(true);
  });
});
