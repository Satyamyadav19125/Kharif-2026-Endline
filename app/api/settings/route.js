import { NextResponse } from "next/server";
import { getCurrentUser, getSettings, saveSettingsPatch } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const s = await getSettings();
  const base = { role: me.role, guest: { enabled: !!(s.guest && s.guest.enabled) } };
  if (me.role !== "admin") return NextResponse.json(base);

  const dbPasswords = (s.security && Array.isArray(s.security.adminPasswords)) ? s.security.adminPasswords : [];
  return NextResponse.json({
    ...base,
    project: s.project || {},
    contact: s.contact || { people: [], showOnLanding: true },
    guest: { enabled: !!(s.guest && s.guest.enabled), password: (s.guest && s.guest.password) || "" },
    security: { adminPasswords: dbPasswords, envUsed: dbPasswords.filter(Boolean).length === 0 },
    checks: s.checks || { duplicates: true, gps: true, unlisted: true },
  });
}

// Admin-only: save any of the settings sections.
export async function POST(request) {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const patch = {};
  for (const k of ["project", "contact", "guest", "security", "checks"]) {
    if (k in body && body[k] && typeof body[k] === "object") patch[k] = body[k];
  }
  if (Object.keys(patch).length) {
    try { await saveSettingsPatch(patch); }
    catch (e) { return NextResponse.json({ error: String(e.message || e) }, { status: 500 }); }
  }
  return NextResponse.json({ ok: true });
}
