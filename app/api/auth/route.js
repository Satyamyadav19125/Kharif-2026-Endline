import { NextResponse } from "next/server";
import { checkAdminPassword, checkGuestPassword, getAssignments, ADMIN_COOKIE, GUEST_COOKIE, USER_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

const clearAll = (res) => {
  res.cookies.set(ADMIN_COOKIE, "", { maxAge: 0, path: "/" });
  res.cookies.set(GUEST_COOKIE, "", { maxAge: 0, path: "/" });
  res.cookies.set(USER_COOKIE, "", { maxAge: 0, path: "/" });
};

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { password, action } = body;

  if (action === "logout") {
    const res = NextResponse.json({ ok: true });
    clearAll(res);
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
    clearAll(res);
    res.cookies.set(ADMIN_COOKIE, password, opts);
    return res;
  }

  // Surveyor: match a password in the assignments roster.
  try {
    const list = await getAssignments();
    const user = list.find((u) => u.password && u.password === password);
    if (user) {
      const res = NextResponse.json({ ok: true, role: "user", name: user.person });
      clearAll(res);
      res.cookies.set(USER_COOKIE, `${user.person}::${password}`, opts);
      return res;
    }
  } catch {}

  if (await checkGuestPassword(password)) {
    const res = NextResponse.json({ ok: true, role: "guest" });
    clearAll(res);
    res.cookies.set(GUEST_COOKIE, password, opts);
    return res;
  }

  return NextResponse.json({ error: "Wrong password" }, { status: 401 });
}
