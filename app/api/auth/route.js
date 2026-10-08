import { NextResponse } from "next/server";
import { checkAdminPassword, checkGuestPassword, ADMIN_COOKIE, GUEST_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { password, action } = body;

  if (action === "logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, "", { maxAge: 0, path: "/" });
    res.cookies.set(GUEST_COOKIE, "", { maxAge: 0, path: "/" });
    return res;
  }

  if (!password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  // secure cookies only in production so local http dev login still works.
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };

  if (await checkAdminPassword(password)) {
    const res = NextResponse.json({ ok: true, role: "admin" });
    res.cookies.set(ADMIN_COOKIE, password, opts);
    res.cookies.set(GUEST_COOKIE, "", { maxAge: 0, path: "/" });
    return res;
  }

  if (await checkGuestPassword(password)) {
    const res = NextResponse.json({ ok: true, role: "guest" });
    res.cookies.set(GUEST_COOKIE, password, opts);
    res.cookies.set(ADMIN_COOKIE, "", { maxAge: 0, path: "/" });
    return res;
  }

  return NextResponse.json({ error: "Wrong password" }, { status: 401 });
}
