import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function parseLoc(s) {
  if (!s || typeof s !== "string") return null;
  const [lat, lng] = s.trim().split(/\s+/).map(Number);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  return null;
}

// GPS points for every submission that has an interview location.
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const db = await getDb();
  const universe = (await db.collection("meta").findOne({ _id: "universe" })) || {};
  const villageLabel = Object.fromEntries((universe.villages || []).map((v) => [v.code, v.label]));
  const enumLabel = Object.fromEntries((universe.enumerators || []).map((e) => [e.code, e.label]));
  const farmsMap = new Map((universe.farms || []).map((f) => [f.id, f]));

  const subs = await db.collection("submissions").find({}, { projection: { _syncedAt: 0 } }).toArray();
  const allowed = me.role === "user" && (me.villages || []).length ? new Set(me.villages) : null;

  const points = [];
  for (const s of subs) {
    const pick = (n) => s["orientation/" + n] ?? s[n];
    const loc = parseLoc(pick("location"));
    if (!loc) continue;
    const vcode = pick("village");
    if (allowed && !allowed.has(vcode)) continue;
    const id = pick("id_farm") || "";
    const farm = farmsMap.get(id);
    points.push({
      id: s._id,
      lat: loc.lat,
      lng: loc.lng,
      vcode: vcode || "",
      village: villageLabel[vcode] || vcode || "",
      farm: id,
      farmer: (farm && farm.farmer) || pick("farmer_name") || "",
      enumerator: enumLabel[pick("name_enu")] || pick("name_enu") || "",
      date: pick("date") || String(s._submission_time || "").slice(0, 10),
      isReturning: String(pick("is_returning") || "").toLowerCase() === "yes",
    });
  }
  return NextResponse.json({ points }, { headers: { "Cache-Control": "private, max-age=30" } });
}
