import { NextResponse } from "next/server";
import { getSettings, getGuestConfig } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

// Public landing data — safe to show logged out, so it can be CDN-cached.
export async function GET() {
  let settings = {};
  try { settings = await getSettings(); } catch {}
  let counts = null;
  try {
    const db = await getDb();
    const u = await db.collection("meta").findOne({ _id: "universe" });
    if (u) counts = { villages: (u.villages || []).length, farms: (u.farms || []).length };
  } catch {}
  let guestEnabled = false;
  try { const g = await getGuestConfig(); guestEnabled = !!(g && g.enabled); } catch {}

  return NextResponse.json(
    {
      project: settings.project || {},
      contact: settings.contact || {},
      counts,
      guestEnabled,
    },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } }
  );
}
