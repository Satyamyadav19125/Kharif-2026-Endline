import { NextResponse } from "next/server";
import { getDb, DB_NAME } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// MongoDB Atlas free tier (M0) gives you 512 MB of storage.
const FREE_TIER_LIMIT = 512 * 1024 * 1024;

// Powers the iPhone-style storage widget in Settings.
export async function GET() {
  try {
    if (!(await getCurrentUser())) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }
    const db = await getDb();
    const stats = await db.command({ dbStats: 1, scale: 1 }); // bytes
    const submissions = await db.collection("submissions").estimatedDocumentCount();
    const state = await db.collection("meta").findOne({ _id: "state" });

    // Atlas measures the cap against on-disk (compressed) storage + indexes.
    const used = (stats.storageSize || 0) + (stats.indexSize || 0);
    const percent = Math.min(100, (used / FREE_TIER_LIMIT) * 100);

    return NextResponse.json(
      {
        db: DB_NAME,
        limitBytes: FREE_TIER_LIMIT,
        usedBytes: used,
        dataSize: stats.dataSize || 0,
        storageSize: stats.storageSize || 0,
        indexSize: stats.indexSize || 0,
        percent,
        objects: stats.objects || 0,
        collections: stats.collections || 0,
        submissions,
        syncedAt: state ? state.lastSyncAt : null,
      },
      { headers: { "Cache-Control": "private, max-age=30" } }
    );
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
