import { createContext, useContext } from "react";
import type { DemoSession } from "@/lib/auth";

const SessionCtx = createContext<DemoSession | null>(null);
export const SessionProvider = SessionCtx.Provider;
export const useSession = () => useContext(SessionCtx)!;
