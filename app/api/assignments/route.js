import { NextResponse } from "next/server";
import { getCurrentUser, getAssignments, saveAssignments } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const list = await getAssignments();
  // Only admins see the passwords.
  if (me.role !== "admin") {
    return NextResponse.json({ assignments: list.map((u) => ({ person: u.person, villages: u.villages, phone: u.phone })) });
  }
  return NextResponse.json({ assignments: list });
}

export async function POST(request) {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  try {
    const saved = await saveAssignments(body.assignments || []);
    return NextResponse.json({ ok: true, count: saved.length });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
