import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/admin/CrudPage";
import { opts } from "@/components/admin/field-options";
import { StatusBadge } from "@/components/admin/ui";
import type { Announcement } from "@/lib/api";

export const Route = createFileRoute("/admin/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements — Athletix Admin" },
      { name: "description", content: "Academy announcements, events and notices." },
    ],
  }),
  component: Announcements,
});

const kinds = ["Announcement", "Event", "Match update", "Training notice"] as const;

function Announcements() {
  return (
    <CrudPage<Announcement>
      resource="announcements"
      title="Announcements & events"
      singular="Announcement"
      text="News, events, match updates and training notices."
      searchKeys={["title", "body"]}
      defaults={{
        kind: "Announcement",
        published: "Yes",
        date: new Date().toISOString().slice(0, 10),
      }}
      filters={[
        { name: "kind", label: "Types", options: opts(kinds) },
        { name: "published", label: "Published", options: opts(["Yes", "No"]) },
      ]}
      columns={[
        {
          key: "title",
          label: "Title",
          render: (r) => (
            <span>
              <span className="font-semibold">{r.title}</span>
              <span className="block max-w-md truncate text-xs text-muted-foreground">
                {r.body}
              </span>
            </span>
          ),
          csv: (r) => r.title,
        },
        { key: "kind", label: "Type" },
        { key: "date", label: "Date" },
        {
          key: "published",
          label: "Published",
          render: (r) => <StatusBadge value={r.published} />,
        },
      ]}
      fields={[
        { name: "title", label: "Title", required: true, full: true },
        { name: "kind", label: "Type", type: "select", options: opts(kinds), required: true },
        { name: "date", label: "Date", type: "date", required: true },
        {
          name: "published",
          label: "Published",
          type: "select",
          options: opts(["Yes", "No"]),
          required: true,
        },
        { name: "body", label: "Message", type: "textarea", required: true },
      ]}
    />
  );
}
