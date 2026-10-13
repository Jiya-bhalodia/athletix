import { Link } from "@tanstack/react-router";
import { contact, navLinks } from "@/data/academy";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t bg-secondary/60">
      <div className="container-site grid gap-10 py-12 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            A multi-sport academy focused on skill, teamwork and growth.
          </p>
        </div>
        <div>
          <p className="eyebrow mb-3">Explore</p>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {navLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-highlight">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/login" className="hover:text-highlight">
                Login
              </Link>
            </li>
            <li>
              <Link to="/enroll" className="hover:text-highlight">
                Enroll
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="eyebrow mb-3">Contact</p>
          <p className="text-muted-foreground">{contact.address}</p>
          <p className="text-muted-foreground">{contact.phone}</p>
          <p className="text-muted-foreground">{contact.email}</p>
        </div>
      </div>
      <div className="border-t">
        <div className="container-site py-5 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Athletix Sports Academy. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
