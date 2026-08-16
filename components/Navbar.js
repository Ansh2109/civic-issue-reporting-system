"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const citizenLinks = [
  { href: "/report",     label: "Report Issue" },
  { href: "/map",        label: "Live Map" },
  { href: "/my-reports", label: "My Reports" },
];

/*
 * Dark charcoal navbar — deliberate choice.
 * Creates a strong chrome/content separation; nav feels structural, not decorative.
 * One terracotta underline on the active link is the only colour on the page header.
 * Everything else in the nav is white or warm-gray on near-black.
 */
export default function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <header
      style={{
        backgroundColor: "#1C1917",
        borderBottom: "1px solid #292524",
      }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">

        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight"
          style={{ color: "#FFFFFF", letterSpacing: "-0.01em" }}
        >
          {/*
           * Brand mark: a simple square with the flag glyph.
           * Terracotta background — same accent used everywhere else.
           * 4px radius matches the design system's card/button radius.
           */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "22px",
              height: "22px",
              borderRadius: "4px",
              backgroundColor: "#C2410C",
              color: "#FFFFFF",
              fontSize: "11px",
              lineHeight: 1,
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            ⚑
          </span>
          CivicReport
        </Link>

        {/* Nav links */}
        <nav
          className="flex items-center"
          aria-label="Main navigation"
          style={{ gap: "0px" }}
        >
          {citizenLinks.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="px-3 text-sm transition-colors"
                style={{
                  color: active ? "#FFFFFF" : "#A8A29E",
                  fontWeight: active ? 500 : 400,
                  paddingTop: "0.25rem",
                  paddingBottom: "0.25rem",
                  /*
                   * Terracotta underline: the one accent colour in the nav.
                   * Border-bottom rather than text-decoration so we control
                   * the gap precisely.
                   */
                  borderBottom: active
                    ? "2px solid #C2410C"
                    : "2px solid transparent",
                  display: "inline-block",
                  lineHeight: "3rem",
                }}
              >
                {label}
              </Link>
            );
          })}

          {/* Divider */}
          <span
            style={{
              display: "inline-block",
              width: "1px",
              height: "16px",
              backgroundColor: "#44403C",
              margin: "0 0.75rem",
              flexShrink: 0,
            }}
            aria-hidden="true"
          />

          {/* Admin link — de-emphasized, for staff not citizens */}
          <Link
            href="/admin/login"
            id="nav-admin-link"
            className="px-3 text-xs transition-colors"
            style={{
              color: isAdmin ? "#FFFFFF" : "#78716C",
              fontWeight: isAdmin ? 500 : 400,
              paddingTop: "0.25rem",
              paddingBottom: "0.25rem",
              letterSpacing: "0.01em",
              borderBottom: isAdmin
                ? "2px solid #C2410C"
                : "2px solid transparent",
              display: "inline-block",
              lineHeight: "3rem",
            }}
          >
            Admin ↗
          </Link>
        </nav>
      </div>
    </header>
  );
}
