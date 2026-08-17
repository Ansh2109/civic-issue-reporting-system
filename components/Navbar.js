"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

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
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsMobileMenuOpen(false);
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <header
      style={{
        backgroundColor: "#1C1917",
        borderBottom: "1px solid #292524",
      }}
      className="sticky top-0 z-50 transition-colors"
    >
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">

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

        {/* Desktop Nav */}
        <nav
          className="hidden sm:flex items-center h-full"
          aria-label="Main navigation"
        >
          {citizenLinks.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="px-5 text-[15px] transition-colors h-full flex items-center hover:bg-[#292524]"
                style={{
                  color: active ? "#FFFFFF" : "#A8A29E",
                  fontWeight: active ? 500 : 400,
                  borderBottom: active
                    ? "2px solid #C2410C"
                    : "2px solid transparent",
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
              height: "20px",
              backgroundColor: "#44403C",
              margin: "0 1rem",
              flexShrink: 0,
            }}
            aria-hidden="true"
          />

          {user && !isAdmin && (
            <button
              onClick={handleSignOut}
              className="px-4 text-[13px] transition-colors hover:text-white h-full flex items-center hover:bg-[#292524]"
              style={{ color: "#A8A29E" }}
            >
              Sign out
            </button>
          )}

          {/* Admin link */}
          <Link
            href="/admin/login"
            id="nav-admin-link"
            className="px-5 text-[13px] transition-colors h-full flex items-center hover:bg-[#292524]"
            style={{
              color: isAdmin ? "#FFFFFF" : "#78716C",
              fontWeight: isAdmin ? 500 : 400,
              letterSpacing: "0.01em",
              borderBottom: isAdmin
                ? "2px solid #C2410C"
                : "2px solid transparent",
            }}
          >
            Admin ↗
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          className="sm:hidden flex items-center justify-center -mr-2 transition-colors"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open menu"
          style={{ color: "#FFFFFF", width: "44px", height: "44px" }}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu Overlay & Panel */}
      {isMobileMenuOpen && (
        <div 
          className="sm:hidden fixed inset-0 z-50 transition-opacity" 
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={closeMenu}
        >
          {/* Slide-down / Dropdown Panel */}
          <nav 
            className="absolute top-0 right-0 left-0 flex flex-col shadow-2xl overflow-hidden"
            style={{ backgroundColor: "#1C1917", borderBottom: "1px solid #292524" }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when tapping inside the panel
          >
            {/* Header / Close button inside the panel */}
            <div className="flex items-center justify-between px-4 h-16" style={{ borderBottom: "1px solid #292524" }}>
              <span className="text-sm font-semibold tracking-tight" style={{ color: "#FFFFFF" }}>
                Menu
              </span>
              <button
                className="flex items-center justify-center -mr-2 transition-colors hover:text-gray-300"
                onClick={closeMenu}
                aria-label="Close menu"
                style={{ color: "#FFFFFF", width: "44px", height: "44px" }}
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="py-2">
              {citizenLinks.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMenu}
                    className="flex items-center px-6 py-4 text-base font-medium transition-colors hover:bg-[#292524]"
                    style={{
                      color: active ? "#C2410C" : "#FFFFFF",
                      backgroundColor: active ? "rgba(194, 65, 12, 0.05)" : "transparent",
                      borderLeft: active ? "4px solid #C2410C" : "4px solid transparent",
                      borderBottom: "1px solid rgba(255,255,255,0.02)",
                    }}
                  >
                    {href === "/report" && (
                      <svg className="w-5 h-5 mr-3 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                    {href === "/map" && (
                      <svg className="w-5 h-5 mr-3 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    )}
                    {href === "/my-reports" && (
                      <svg className="w-5 h-5 mr-3 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    )}
                    {label}
                  </Link>
                );
              })}
              
              <div style={{ height: "1px", backgroundColor: "#292524", margin: "0.25rem 0" }} />
              
              {user && !isAdmin && (
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full text-left px-6 py-4 text-base font-medium transition-colors hover:bg-[#292524]"
                  style={{ color: "#A8A29E", borderLeft: "4px solid transparent", borderBottom: "1px solid rgba(255,255,255,0.02)" }}
                >
                  <svg className="w-5 h-5 mr-3 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              )}
              
              <Link
                href="/admin/login"
                onClick={closeMenu}
                className="flex items-center px-6 py-4 text-base font-medium transition-colors hover:bg-[#292524]"
                style={{
                  color: isAdmin ? "#C2410C" : "#A8A29E",
                  backgroundColor: isAdmin ? "rgba(194, 65, 12, 0.05)" : "transparent",
                  borderLeft: isAdmin ? "4px solid #C2410C" : "4px solid transparent",
                }}
              >
                <svg className="w-5 h-5 mr-3 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Admin ↗
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
