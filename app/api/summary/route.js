import { NextResponse } from "next/server";
import { getSummaryDoc } from "@/lib/sync";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// The dashboard's only read path. Returns the small precomputed summary. Now
// that it's behind login, it uses a private (per-browser) cache — never the
// shared CDN — which still spares repeat loads and keeps Vercel transfer low.
export async function GET() {
  try {
    if (!(await getCurrentUser())) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }
    const summary = await getSummaryDoc({ syncIfMissing: true });
    if (!summary) {
      return NextResponse.json({ error: "No data yet. Try Refresh." }, { status: 503 });
    }
    return new NextResponse(JSON.stringify(summary), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
