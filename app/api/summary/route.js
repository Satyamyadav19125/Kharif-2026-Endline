import { NextResponse } from "next/server";
import { getSummaryDoc } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// The dashboard's only read path. Returns the small precomputed summary and
// lets Vercel's edge cache serve repeat visitors for 2 minutes — so most page
// loads never touch the function or Mongo, keeping origin transfer tiny.
export async function GET() {
  try {
    const summary = await getSummaryDoc({ syncIfMissing: true });
    if (!summary) {
      return NextResponse.json({ error: "No data yet. Try Refresh." }, { status: 503 });
    }
    return new NextResponse(JSON.stringify(summary), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
