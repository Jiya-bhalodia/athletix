import { authApi, type AuthUser } from "./api/client";

export type Role = "Admin" | "Coach" | "Player" | "Parent";
export type StaffSession = {
  id: string;
  email: string;
  name: string;
  role: Role;
  profileId?: string;
  linkedId?: string;
};
export type DemoSession = StaffSession;
let current: StaffSession | null = null;
let restorePromise: Promise<StaffSession | null> | null = null;

const displayName = (email: string) =>
  email
    .split("@")[0]!
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
const toSession = (user: AuthUser | null): StaffSession | null =>
  user
    ? {
        id: user.id,
        email: user.email,
        name: displayName(user.email),
        role: ({ admin: "Admin", coach: "Coach", player: "Player", parent: "Parent" } as const)[
          user.role
        ],
        ...(user.profileId ? { profileId: user.profileId, linkedId: user.profileId } : {}),
      }
    : null;

export const homeFor = (role: Role) =>
  role === "Player" ? "/player" : role === "Parent" ? "/parent" : "/admin";
export const auth = {
  get: () => current,
  async restore() {
    if (!restorePromise)
      restorePromise = authApi
        .me()
        .then((r) => (current = toSession(r.user)))
        .catch((error) => {
          restorePromise = null;
          throw error;
        });
    return restorePromise;
  },
  async signIn(email: string, password: string) {
    const user = await authApi.login(email, password);
    current = toSession(user);
    restorePromise = Promise.resolve(current);
    return current;
  },
  async signOut() {
    try {
      await authApi.logout();
    } finally {
      current = null;
      restorePromise = null;
    }
  },
  clear() {
    current = null;
    restorePromise = null;
  },
};
