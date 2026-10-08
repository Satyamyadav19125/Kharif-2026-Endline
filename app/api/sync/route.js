import { NextResponse } from "next/server";
import { runSync } from "@/lib/sync";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Vercel Cron hits this with GET. If CRON_SECRET is set, it must match the
// Bearer token Vercel sends; otherwise the endpoint is open.
function cronAuthorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return (request.headers.get("authorization") || "") === `Bearer ${secret}`;
}

export async function GET(request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const r = await runSync({ force: true });
    return NextResponse.json(r);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}

// Manual refresh from the UI (logged-in users only).
export async function POST(request) {
  try {
    if (!(await getCurrentUser())) {
      return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });
    }
    const force = new URL(request.url).searchParams.get("force") === "1";
    const r = await runSync({ force });
    return NextResponse.json(r);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
