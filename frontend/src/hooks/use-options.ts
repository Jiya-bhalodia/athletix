import { useResourceList } from "./use-resource";
import type { ApiKey } from "@/lib/api";
import type { Option } from "@/components/admin/CrudPage";

export function useOptions(key: ApiKey): Option[] {
  const query = useResourceList(key);
  const rows = (query.data ?? []) as unknown as { id: string; name?: string; title?: string }[];
  if (query.isLoading)
    return [{ value: "__options_loading__", label: "Loading options…", disabled: true }];
  if (query.isError)
    return [
      {
        value: "__options_error__",
        label: "Options failed to load — check connection and refresh",
        disabled: true,
      },
    ];
  if (!rows.length) {
    const guidance: Partial<Record<ApiKey, string>> = {
      sports: "No sports yet — add a sport in Sports & Teams first",
      coaches: "No coaches yet — add a coach first",
      teams: "No teams yet — add a team in Sports & Teams first",
      players: "No players yet — add a player first",
      feePlans: "No fee plans yet — add a fee plan first",
      matches: "No matches yet — add a match first",
    };
    return [
      {
        value: "__options_empty__",
        label: guidance[key] ?? `No ${key} available yet`,
        disabled: true,
      },
    ];
  }
  return rows.map((r) => ({ value: r.id, label: r.name ?? r.title ?? r.id }));
}
