import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { fetchAsset, koboForm, koboBase, koboToken } from "@/lib/kobo";

export const dynamic = "force-dynamic";

// Health check for the Settings page: is KoBo reachable, is Mongo reachable.
export async function GET() {
  const out = {
    kobo: false,
    mongo: false,
    formName: null,
    form: koboForm(),
    base: koboBase(),
    tokenSet: !!koboToken(),
    syncedAt: null,
  };

  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    out.mongo = true;
    const state = await db.collection("meta").findOne({ _id: "state" });
    out.syncedAt = state ? state.lastSyncAt : null;
  } catch (e) {
    out.mongoError = String(e.message || e);
  }

  try {
    const a = await fetchAsset();
    out.kobo = true;
    out.formName = a.name;
    out.koboCount = a.submissionCount;
  } catch (e) {
    out.koboError = String(e.message || e);
  }

  return NextResponse.json(out, { headers: { "Cache-Control": "no-store" } });
}
