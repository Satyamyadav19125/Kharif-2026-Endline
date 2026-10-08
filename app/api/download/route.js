import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Flatten nested objects into "a/b/c" keys; arrays become JSON strings.
function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    if (k === "_syncedAt") continue;
    const key = prefix ? `${prefix}/${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
    else if (Array.isArray(v)) out[key] = JSON.stringify(v);
    else out[key] = v;
  }
  return out;
}

// Put the most useful identity columns first, then everything else A->Z.
function orderKeys(keys) {
  const lead = [
    "_id",
    "_submission_time",
    "orientation/date",
    "orientation/village",
    "orientation/id_farm",
    "orientation/farmer_name",
    "orientation/name_enu",
    "orientation/is_returning",
  ];
  const set = new Set(keys);
  const rest = keys.filter((k) => !lead.includes(k)).sort();
  return [...lead.filter((k) => set.has(k)), ...rest];
}

// GET /api/download?format=csv|xlsx  -> downloads all stored submissions.
export async function GET(request) {
  try {
    const format = (new URL(request.url).searchParams.get("format") || "xlsx").toLowerCase();
    const db = await getDb();
    const subs = await db
      .collection("submissions")
      .find({}, { projection: { _syncedAt: 0 } })
      .toArray();

    const rows = subs.map((s) => flatten(s));
    const keySet = new Set();
    rows.forEach((r) => Object.keys(r).forEach((k) => keySet.add(k)));
    const header = orderKeys([...keySet]);

    const ws = XLSX.utils.json_to_sheet(rows, { header });
    const stamp = new Date().toISOString().slice(0, 10);

    if (format === "csv") {
      const csv = XLSX.utils.sheet_to_csv(ws);
      return new NextResponse("﻿" + csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="endline-2026-${stamp}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Endline 2026");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="endline-2026-${stamp}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
