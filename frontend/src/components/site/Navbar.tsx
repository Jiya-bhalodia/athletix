import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { navLinks } from "@/data/academy";
import { Logo } from "./Logo";
import { buttonStyles } from "./button-styles";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const linkCls =
    "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary";
  const active = { className: "text-foreground" };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
      <div className="container-site flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={linkCls}
              activeProps={active}
              activeOptions={{ exact: true }}
            >
              {l.label}
            </Link>
          ))}
          <div className="ml-3 flex items-center gap-2">
            <Link to="/login" className={buttonStyles({ variant: "ghost", size: "sm" })}>
              Login
            </Link>
            <Link to="/enroll" className={buttonStyles({ variant: "primary", size: "sm" })}>
              Join Academy
            </Link>
          </div>
        </nav>
        <button
          className="rounded-md p-2 hover:bg-secondary lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t bg-background lg:hidden">
          <nav className="container-site flex flex-col py-3">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={linkCls}
                activeProps={active}
                activeOptions={{ exact: true }}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className={buttonStyles({ variant: "outline", size: "sm" })}
              >
                Login
              </Link>
              <Link
                to="/enroll"
                onClick={() => setOpen(false)}
                className={buttonStyles({ variant: "primary", size: "sm" })}
              >
                Join Academy
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
