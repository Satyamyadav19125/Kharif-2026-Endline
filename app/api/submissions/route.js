import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function decodeValue(raw, field, choiceMap) {
  if (raw == null || raw === "") return "";
  if ((field.type === "select_one" || field.type === "select_multiple") && field.list && choiceMap[field.list]) {
    const map = choiceMap[field.list];
    return String(raw).split(/\s+/).map((c) => map[c] || c).join(", ");
  }
  return raw;
}
const decodeOne = (code, map) => (code && map && map[code]) || code || "";

// Rows for the Submissions table: a few headline columns plus a `details`
// object (all surveyor-facing answers, decoded) for the expandable view.
export async function GET() {
  try {
    if (!(await getCurrentUser())) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }
    const db = await getDb();
    const universe = (await db.collection("meta").findOne({ _id: "universe" })) || {};
    const cm = universe.choiceMap || {};
    const fields = universe.downloadFields || [];
    const farmsMap = new Map((universe.farms || []).map((f) => [f.id, f]));
    const villageLabel = Object.fromEntries((universe.villages || []).map((v) => [v.code, v.label]));
    const enumLabel = Object.fromEntries((universe.enumerators || []).map((e) => [e.code, e.label]));

    const subs = await db
      .collection("submissions")
      .find({}, { projection: { _syncedAt: 0 } })
      .sort({ _submission_time: -1 })
      .toArray();

    const rows = subs.map((s) => {
      // Robust field lookup: orientation group, then bare name, then any group.
      const pick = (n) => {
        if (s["orientation/" + n] != null) return s["orientation/" + n];
        if (s[n] != null) return s[n];
        const k = Object.keys(s).find((key) => key.endsWith("/" + n));
        return k ? s[k] : undefined;
      };
      const idFarm = pick("id_farm") || "";
      const farm = farmsMap.get(idFarm);
      const details = {};
      for (const f of fields) {
        const v = decodeValue(s[f.key], f, cm);
        if (v !== "" && v != null) details[f.label] = v;
      }
      return {
        uid: s._id,
        date: pick("date") || String(s._submission_time || "").slice(0, 10),
        village: villageLabel[pick("village")] || pick("village") || "",
        farm: idFarm,
        farmer: (farm && farm.farmer) || pick("farmer_name") || "",
        enumerator: enumLabel[pick("name_enu")] || pick("name_enu") || "",
        returning: String(pick("is_returning") || "").toLowerCase() === "yes",
        acres: pick("acres") || "",
        sowing: decodeOne(pick("sowing_type"), cm.sowing),
        details,
      };
    });

    return NextResponse.json(
      { count: rows.length, rows },
      { headers: { "Cache-Control": "private, max-age=30" } }
    );
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
