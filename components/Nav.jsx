"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toggleTheme } from "@/app/ui";

const LINKS = [
  { href: "/", label: "Overview", icon: "🏠" },
  { href: "/submissions", label: "Submissions", icon: "📋" },
  { href: "/summary", label: "Summary", icon: "📊" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Nav({ user }) {
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function refresh() {
    setSyncing(true);
    try {
      await fetch("/api/sync?force=1", { method: "POST" });
      router.refresh();
      if (typeof window !== "undefined") window.location.reload();
    } catch {
      setSyncing(false);
    }
  }

  async function logout() {
    if (!confirm("Log out?")) return;
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    window.location.href = "/login";
  }

  const links = user?.role === "guest" ? LINKS.filter((l) => l.href !== "/settings") : LINKS;

  return (
    <>
      <header className="bg-hero-gradient text-white sticky top-0 z-[1000] shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-bold text-base flex-1 min-w-0">
            <span className="text-xl">🌾</span>
            <span className="truncate">Endline 2026</span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5 text-sm">
            {links.map((l) => (
              <Link key={l.href} href={l.href}
                className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${pathname === l.href ? "bg-white/20" : "hover:bg-white/10"}`}>
                {l.label}
              </Link>
            ))}
          </nav>

          <button onClick={refresh} disabled={syncing} title="Refresh data"
            className="p-2 rounded-lg hover:bg-white/10 text-lg disabled:opacity-50">
            {syncing ? "…" : "↻"}
          </button>
          <button onClick={() => toggleTheme()} title="Toggle theme" className="p-2 rounded-lg hover:bg-white/10 text-lg">◑</button>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 text-sm font-medium">
            <span>{user?.role === "admin" ? "👑" : "👁️"}</span>
            <span className="truncate max-w-[90px]">{user?.name || "User"}</span>
          </span>
          <button onClick={logout} title="Log out" className="p-2 rounded-lg hover:bg-red-500/40 text-lg">⏻</button>

          <button className="md:hidden p-2 -mr-2 rounded-lg hover:bg-white/10" onClick={() => setOpen(!open)} aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </header>

      {open && (
        <div className="md:hidden fixed inset-0 z-[1100] bg-black/40" onClick={() => setOpen(false)}>
          <div className="absolute top-14 right-0 w-64 bg-white shadow-xl rounded-bl-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <nav className="flex flex-col">
              {links.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                  className={`px-4 py-3 border-b border-slate-100 flex items-center gap-3 ${pathname === l.href ? "bg-field-50 text-field-900 font-medium" : ""}`}>
                  <span>{l.icon}</span><span>{l.label}</span>
                </Link>
              ))}
              <button onClick={logout} className="px-4 py-3 flex items-center gap-3 text-red-600 text-left">
                <span>⏻</span><span>Log out</span>
              </button>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
