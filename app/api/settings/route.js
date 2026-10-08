import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getCurrentUser, getGuestConfig } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const g = await getGuestConfig();
  return NextResponse.json({
    role: me.role,
    guest: { enabled: !!(g && g.enabled), hasPassword: !!(g && g.password) },
  });
}

// Admin-only: enable/disable the read-only guest viewer and set its password.
export async function POST(request) {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const update = {};
  if (body.guest && typeof body.guest === "object") {
    update.guest = {
      enabled: !!body.guest.enabled,
      password: String(body.guest.password || "").trim(),
    };
  }
  if (Object.keys(update).length) {
    const db = await getDb();
    await db.collection("meta").updateOne({ _id: "settings" }, { $set: update }, { upsert: true });
  }
  return NextResponse.json({ ok: true });
}
