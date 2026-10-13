import { PageHeader, Panel, Empty } from "@/components/admin/ui";
import { ChildProvider, ChildSelector } from "./child-context";
import { useChild } from "./child-context-store";
import { WithPlayer } from "./views";
import type { PlayerView } from "@/lib/api/portal";

/** Parent page shell: title, child switcher, and the selected (linked) child's data. */
export function ParentPage({
  title,
  text,
  children,
}: {
  title: string;
  text: (name: string) => string;
  children: (v: NonNullable<PlayerView>) => React.ReactNode;
}) {
  return (
    <ChildProvider>
      <Inner title={title} text={text}>
        {children}
      </Inner>
    </ChildProvider>
  );
}
function Inner({
  title,
  text,
  children,
}: {
  title: string;
  text: (name: string) => string;
  children: (v: NonNullable<PlayerView>) => React.ReactNode;
}) {
  const c = useChild();
  const kid = c.children.find((k) => k.id === c.selectedId);
  if (c.error)
    return (
      <Panel>
        <Empty text={c.error} />
      </Panel>
    );
  if (!c.loading && !c.children.length)
    return (
      <Panel>
        <Empty text="No children are linked to this account yet." />
      </Panel>
    );
  return (
    <>
      <PageHeader title={title} text={kid ? text(kid.name.split(" ")[0]!) : "Loading…"}>
        <ChildSelector />
      </PageHeader>
      <WithPlayer playerId={c.selectedId ?? (c.loading ? undefined : "")}>{children}</WithPlayer>
    </>
  );
}
