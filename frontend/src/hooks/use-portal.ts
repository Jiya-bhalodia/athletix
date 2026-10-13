import { useQuery } from "@tanstack/react-query";
import { auth } from "@/lib/auth";
import { portalService } from "@/lib/api/portal";

export function usePlayerView(playerId: string | undefined) {
  const role = auth.get()?.role;
  return useQuery({
    queryKey: ["portal", role, playerId],
    queryFn: () => portalService.playerView(playerId!, role!),
    enabled: Boolean(playerId && (role === "Player" || role === "Parent")),
  });
}

export function useParentChildren(parentId: string | undefined) {
  return useQuery({
    queryKey: ["portal", "children", parentId],
    queryFn: () => portalService.parentChildren(parentId!),
    enabled: Boolean(parentId && auth.get()?.role === "Parent"),
  });
}
