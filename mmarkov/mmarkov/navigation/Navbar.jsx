import "./navigation.css";
import { useEffect, useState, useCallback, useMemo } from "react";


const DEFAULT_LINKS = [
  { href: "#home", label: "HOME" },
  { href: "#methodology", label: "METHODOLOGY" },
  { href: "#upcoming", label: "UPCOMING" },
  { href: "#tiers", label: "TIERS" },
  { href: "#contact", label: "CONTACT" },
  { href: "#login", label: "LOGIN", className: "login" }
];

const getHash = () =>
  typeof window !== "undefined" ? (window.location.hash || "#home") : "#home";

export default function Navbar({ links: linksProp }) {
  const links = useMemo(() => linksProp ?? DEFAULT_LINKS, [linksProp]);

  const [active, setActive] = useState(() => getHash());

  const handleHashChange = useCallback(() => {
    setActive(getHash());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [handleHashChange]);

  return (
    <nav aria-label="Navigation">
      <ul className="navbar">
        {links.map(({ href, label, className }) => {
          const isActive = active === href;
          return (
            <li className={`navitem ${className ?? ""}`} key={href}>
              <a
                className={`navlink ${className ?? ""} ${isActive ? "active" : ""}`}
                href={href}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setActive(href)} // ensures immediate visual update
              >
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
