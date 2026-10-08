"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "./Nav";

// Gates the app behind login: checks /api/auth/check, redirects to /login when
// not signed in, otherwise renders the nav + page. `children` may be a function
// that receives the current user.
export default function AppFrame({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  const router = useRouter();

  useEffect(() => {
    let stop = false;
    fetch("/api/auth/check", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (stop) return;
        if (d.user) setUser(d.user);
        else {
          setUser(null);
          router.replace("/login");
        }
      })
      .catch(() => {
        if (!stop) {
          setUser(null);
          router.replace("/login");
        }
      });
    return () => {
      stop = true;
    };
  }, [router]);

  if (user === undefined) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="spin" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <>
      <Nav user={user} />
      <main className="max-w-6xl mx-auto px-4 py-4 pb-20">
        {typeof children === "function" ? children(user) : children}
      </main>
    </>
  );
}
