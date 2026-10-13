import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type ApiKey } from "@/lib/api";
import type { Entity } from "@/lib/api/types";
import type { ListParams } from "@/lib/api/client";

type Row<K extends ApiKey> = Awaited<ReturnType<(typeof api)[K]["list"]>>[number];

export function useResourceList<K extends ApiKey>(key: K, params: ListParams = {}) {
  return useQuery({
    queryKey: [key, params],
    queryFn: () => api[key].list(params) as Promise<Row<K>[]>,
  });
}

export function useResourcePage<K extends ApiKey>(key: K, params: ListParams = {}) {
  return useQuery({
    queryKey: [key, "page", params],
    queryFn: () =>
      api[key].listPage(params) as Promise<{
        rows: Row<K>[];
        pagination?: { page: number; limit: number; total: number; pages: number };
      }>,
  });
}

export function useList<K extends ApiKey>(key: K, params: ListParams = {}) {
  return useResourceList(key, params).data ?? ([] as Row<K>[]);
}

export function useMutations<K extends ApiKey>(key: K) {
  const qc = useQueryClient();
  const res = api[key] as unknown as {
    create(d: unknown): Promise<Entity>;
    update(id: string, d: unknown): Promise<Entity>;
    remove(id: string): Promise<void>;
  };
  const done = () => {
    qc.invalidateQueries({ queryKey: [key] });
    qc.invalidateQueries({ queryKey: ["activities"] });
    qc.invalidateQueries({ queryKey: ["portal"] });
    qc.invalidateQueries({ queryKey: ["reports"] });
  };
  const onError = (e: Error) => toast.error(e.message);
  return {
    create: useMutation({
      mutationFn: (d: Omit<Row<K>, "id">) => res.create(d),
      onSuccess: done,
      onError,
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<Row<K>> }) => res.update(id, data),
      onSuccess: done,
      onError,
    }),
    remove: useMutation({ mutationFn: (id: string) => res.remove(id), onSuccess: done, onError }),
  };
}

/** id -> name lookup helper */
export function useNames<K extends ApiKey>(key: K) {
  const rows = useList(key) as unknown as { id: string; name?: string; title?: string }[];
  const map = new Map(rows.map((r) => [r.id, r.name ?? r.title ?? r.id]));
  return (id: string) => map.get(id) ?? "—";
}
