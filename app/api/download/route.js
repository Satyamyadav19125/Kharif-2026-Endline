import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getDb } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Decode coded answers into readable text (e.g. "dsr" -> "DSR", variety codes
// -> variety names). select_multiple values are space-separated codes.
function decodeValue(raw, field, choiceMap) {
  if (raw == null || raw === "") return "";
  if ((field.type === "select_one" || field.type === "select_multiple") && field.list && choiceMap[field.list]) {
    const map = choiceMap[field.list];
    return String(raw).split(/\s+/).map((c) => map[c] || c).join(", ");
  }
  return raw;
}

// GET /api/download?format=csv|xlsx
// Exports ONLY the UID + the questions the surveyor actually fills in — the
// system/meta/calculated columns that appear only in the raw KoBo export are
// left out. The xlsx also carries a Summary sheet.
export async function GET(request) {
  try {
    const me = await getCurrentUser();
    if (!me) return new Response("Not logged in", { status: 401 });
    if (me.role === "guest") return new Response("Downloads are disabled for guest viewers.", { status: 403 });

    const format = (new URL(request.url).searchParams.get("format") || "xlsx").toLowerCase();
    const db = await getDb();
    const universe = (await db.collection("meta").findOne({ _id: "universe" })) || {};
    const choiceMap = universe.choiceMap || {};
    const fields = universe.downloadFields || [];
    const subs = await db
      .collection("submissions")
      .find({}, { projection: { _syncedAt: 0 } })
      .sort({ _submission_time: 1 })
      .toArray();

    const header = ["UID", ...fields.map((f) => f.label)];
    const rows = subs.map((s) => {
      const row = { UID: s._id };
      for (const f of fields) row[f.label] = decodeValue(s[f.key], f, choiceMap);
      return row;
    });

    const stamp = new Date().toISOString().slice(0, 10);

    if (format === "csv") {
      const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ UID: "" }], { header });
      const csv = XLSX.utils.sheet_to_csv(ws);
      return new NextResponse("﻿" + csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="endline-2026-${stamp}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const wb = XLSX.utils.book_new();

    // --- Summary sheet (first tab) ---
    const sum = (await db.collection("meta").findOne({ _id: "summary" }))?.summary;
    if (sum) {
      const t = sum.totals;
      const a = sum.analytics || {};
      const aoa = [
        ["ENDLINE 2026 — SUMMARY"],
        [`Generated ${new Date().toLocaleString()}`],
        [],
        ["Villages", t.villages],
        ["Total farms", t.farms],
        ["Surveyed", t.surveyed],
        ["Pending", t.pending],
        ["Percent done", t.percent + "%"],
        ["Submissions", t.submissions],
        ["Returning farms", t.returning],
        ["New farms", t.new],
        [],
        ["FARM PRACTICES (surveyed farms)"],
        ["Total acres", a.acres?.total ?? ""],
        ["Avg acres / farm", a.acres?.avg != null ? a.acres.avg.toFixed(1) : ""],
        ["Avg irrigation hours / acre", a.hoursPerAcre != null ? a.hoursPerAcre.toFixed(1) : ""],
        ["Avg Urea bags / acre", a.urea != null ? a.urea.toFixed(1) : ""],
        ["Avg DAP bags / acre", a.dap != null ? a.dap.toFixed(1) : ""],
        ["Used canal water", a.canal ?? ""],
        ["Had PVC pipe fixed", a.pipeFix ?? ""],
        ["Looked into pipe", a.pipeLooking ?? ""],
        ["Used pipe to decide irrigation", a.pipeDecision ?? ""],
        ["Had fungi", a.fungi ?? ""],
        ["Shared water OUT", a.sharingOut ?? ""],
        ["Received water IN", a.sharingIn ?? ""],
        [],
        ["PER VILLAGE", "Surveyed", "Total", "Pending"],
        ...sum.perVillage.map((v) => [v.label, v.surveyed, v.total, v.pending]),
        [],
        ["ENUMERATOR", "Farms"],
        ...sum.leaderboard.map((l) => [l.name, l.count]),
        [],
        ["SOWING METHOD", "Count"],
        ...(a.sowing || []).map((x) => [x.label, x.count]),
        [],
        ["RICE VARIETY", "Count"],
        ...(a.varieties || []).map((x) => [x.label, x.count]),
        [],
        ["SOIL TYPE", "Count"],
        ...(a.soil || []).map((x) => [x.label, x.count]),
      ];
      const s = XLSX.utils.aoa_to_sheet(aoa);
      s["!cols"] = [{ wch: 30 }, { wch: 12 }, { wch: 10 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, s, "Summary");
    }

    // --- Data sheet (surveyor-facing columns only) ---
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ UID: "" }], { header });
    ws["!cols"] = header.map((h) => ({ wch: Math.max(10, Math.min(42, String(h).length + 2)) }));
    XLSX.utils.book_append_sheet(wb, ws, "Submissions");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="endline-2026-${stamp}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
