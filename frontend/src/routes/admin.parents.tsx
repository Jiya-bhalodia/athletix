import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/admin/CrudPage";
import { opts } from "@/components/admin/field-options";
import { useOptions } from "@/hooks/use-options";
import type { Parent } from "@/lib/api";

export const Route = createFileRoute("/admin/parents")({
  head: () => ({
    meta: [
      { title: "Parents — Athletix Admin" },
      { name: "description", content: "Manage parent accounts and linked players." },
    ],
  }),
  component: Parents,
});

function Parents() {
  const players = useOptions("players");
  return (
    <CrudPage<Parent>
      resource="parents"
      title="Parents & guardians"
      singular="Parent"
      text="Create parent profiles, link their children and set up portal access."
      searchKeys={["name", "email", "phone"]}
      loginAccounts
      columns={[
        { key: "name", label: "Parent", csv: (r) => r.name },
        { key: "email", label: "Login email" },
        { key: "phone", label: "Phone" },
        {
          key: "childIds",
          label: "Linked players",
          render: (r) => String(r.childIds?.length ?? 0),
        },
        {
          key: "account",
          label: "Portal access",
          render: (r) => (r.userId ? "Enabled" : "Not set up"),
        },
      ]}
      fields={[
        { name: "name", label: "Full name", required: true },
        { name: "email", label: "Email / login email", type: "email", required: true },
        { name: "phone", label: "Phone", type: "tel", required: true },
        {
          name: "childIds",
          label: "Linked players (select one or more)",
          type: "select",
          options: players,
          multiple: true,
          full: true,
        },
        {
          name: "loginPassword",
          label: "Initial login password (12+ characters)",
          type: "password",
          required: true,
          full: true,
        },
      ]}
    />
  );
}
