import type { Match } from "@/lib/api";

export const resultOf = (match: Match) =>
  match.status !== "Completed" || match.ourScore == null || match.theirScore == null
    ? "—"
    : match.ourScore > match.theirScore
      ? "Won"
      : match.ourScore < match.theirScore
        ? "Lost"
        : "Draw";
