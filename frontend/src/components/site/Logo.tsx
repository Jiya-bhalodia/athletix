import { Link } from "@tanstack/react-router";
import { academy } from "@/data/academy";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
      <span className="grid h-8 w-8 place-items-center rounded-md bg-primary border border-foreground/10">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 20 12 4l8 16M7.5 13h9" />
        </svg>
      </span>
      <span className="text-lg">{academy.name}</span>
    </Link>
  );
}
