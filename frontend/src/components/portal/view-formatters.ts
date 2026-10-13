export const inr = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

export const fmt = (date: string) =>
  date
    ? new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
