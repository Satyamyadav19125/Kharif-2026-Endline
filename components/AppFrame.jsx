"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "./Nav";

// Gates the app behind login. When `fallback` is given (the landing page) it is
// shown to logged-out visitors instead of redirecting; otherwise they go to
// /login. `children` may be a function that receives the current user.
export default function AppFrame({ children, fallback = null }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  const router = useRouter();
  const hasFallback = !!fallback;

  useEffect(() => {
    let stop = false;
    fetch("/api/auth/check", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (stop) return;
        if (d.user) setUser(d.user);
        else { setUser(null); if (!hasFallback) router.replace("/login"); }
      })
      .catch(() => { if (!stop) { setUser(null); if (!hasFallback) router.replace("/login"); } });
    return () => { stop = true; };
  }, [router, hasFallback]);

  if (user === undefined) {
    return <div className="min-h-screen grid place-items-center"><div className="spin" /></div>;
  }

  if (!user) {
    if (!fallback) return null;
    return (
      <>
        <header className="bg-hero-gradient text-white sticky top-0 z-[1000] shadow-md">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2">
            <span className="flex items-center gap-2 font-bold text-base flex-1 min-w-0">
              <span className="text-xl">🌾</span><span className="truncate">Endline 2026</span>
            </span>
            <Link href="/login" className="px-4 py-1.5 rounded-lg bg-white text-field-800 text-sm font-semibold hover:bg-field-50">Log in</Link>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6 pb-20">{fallback}</main>
      </>
    );
  }

  return (
    <>
      <Nav user={user} />
      <main className="max-w-6xl mx-auto px-4 py-4 pb-20">
        {typeof children === "function" ? children(user) : children}
      </main>
    </>
  );
}
