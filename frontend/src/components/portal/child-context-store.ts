import { createContext, useContext } from "react";
import type { Player } from "@/lib/api/types";

type ChildContextValue = {
  children: Player[];
  loading: boolean;
  error?: string;
  selectedId: string | undefined;
  select: (id: string) => void;
};

export const ChildContext = createContext<ChildContextValue | null>(null);
export const useChild = () => useContext(ChildContext)!;
