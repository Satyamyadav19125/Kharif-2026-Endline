import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import { koboBase, koboForm } from "@/lib/kobo";

export const dynamic = "force-dynamic";

// Raw KoBo submissions exactly as stored — for the admin "Kobo view" tab.
export async function GET() {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const db = await getDb();
  const submissions = await db
    .collection("submissions")
    .find({}, { projection: { _syncedAt: 0 } })
    .sort({ _submission_time: -1 })
    .toArray();
  const dataTableUrl = `${koboBase()}/#/forms/${koboForm()}/data/table`;
  return NextResponse.json({ submissions, dataTableUrl }, { headers: { "Cache-Control": "private, max-age=30" } });
}
