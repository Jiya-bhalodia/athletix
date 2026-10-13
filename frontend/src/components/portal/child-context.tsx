import { useEffect, useMemo, useState } from "react";
import { useSession } from "./session-context";
import { useChild } from "./child-context-store";
import { useParentChildren } from "@/hooks/use-portal";
import { ChildContext } from "./child-context-store";
const KEY = "athletix-parent-child";

/** Selected child for the Parent portal. Only ids linked to this parent can be selected. */
export function ChildProvider({ children }: { children: React.ReactNode }) {
  const s = useSession();
  const q = useParentChildren(s.linkedId);
  const kids = useMemo(() => q.data ?? [], [q.data]);
  const [selected, setSelected] = useState<string | undefined>();
  useEffect(() => {
    if (!kids.length) return;
    const saved = localStorage.getItem(KEY);
    setSelected((cur) =>
      cur && kids.some((k) => k.id === cur)
        ? cur
        : kids.some((k) => k.id === saved)
          ? saved!
          : kids[0]!.id,
    );
  }, [kids]);
  const select = (id: string) => {
    if (kids.some((k) => k.id === id)) {
      setSelected(id);
      localStorage.setItem(KEY, id);
    }
  };
  return (
    <ChildContext.Provider
      value={{
        children: kids,
        loading: q.isLoading,
        ...(q.isError ? { error: q.error.message } : {}),
        selectedId: selected,
        select,
      }}
    >
      {children}
    </ChildContext.Provider>
  );
}

export function ChildSelector() {
  const { children, selectedId, select } = useChild();
  if (children.length < 2) return null;
  return (
    <div
      role="tablist"
      aria-label="Select child"
      className="flex flex-wrap gap-1 rounded-lg border bg-card p-1"
    >
      {children.map((c) => (
        <button
          key={c.id}
          role="tab"
          aria-selected={c.id === selectedId}
          onClick={() => select(c.id)}
          className={
            c.id === selectedId
              ? "rounded-md bg-primary px-3 py-1.5 text-sm font-semibold"
              : "rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          }
        >
          {c.name.split(" ")[0]}
        </button>
      ))}
    </div>
  );
}
