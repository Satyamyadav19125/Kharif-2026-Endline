import { NextResponse } from "next/server";
import clientPromise, { getDb, DB_NAME } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// MongoDB Atlas free tier (M0) gives you 512 MB of storage for the WHOLE cluster
// (shared by every app's database on it).
const FREE_TIER_LIMIT = 512 * 1024 * 1024;
const SYSTEM_DBS = new Set(["admin", "local", "config"]);

export async function GET() {
  try {
    if (!(await getCurrentUser())) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }
    const client = await clientPromise;

    // --- This tool's own database ---
    const db = await getDb();
    const stats = await db.command({ dbStats: 1, scale: 1 }); // bytes
    const submissions = await db.collection("submissions").estimatedDocumentCount();
    const state = await db.collection("meta").findOne({ _id: "state" });
    const ourUsed = (stats.storageSize || 0) + (stats.indexSize || 0);

    // --- Every database on the cluster (if the user has listDatabases rights) ---
    let databases = [];
    let listedAll = false;
    try {
      const { databases: dbs } = await client.db("admin").admin().listDatabases();
      for (const d of dbs) {
        if (SYSTEM_DBS.has(d.name)) continue;
        let used = d.sizeOnDisk || 0;
        let dataSize = 0, indexSize = 0, collections = 0, objects = 0;
        try {
          const st = await client.db(d.name).command({ dbStats: 1, scale: 1 });
          dataSize = st.dataSize || 0;
          indexSize = st.indexSize || 0;
          collections = st.collections || 0;
          objects = st.objects || 0;
          used = (st.storageSize || 0) + indexSize;
        } catch {}
        databases.push({ name: d.name, used, dataSize, indexSize, collections, objects, isThisTool: d.name === DB_NAME });
      }
      listedAll = true;
    } catch {
      // No cluster-wide permission — show only this tool's database.
      databases = [{ name: DB_NAME, used: ourUsed, dataSize: stats.dataSize || 0, indexSize: stats.indexSize || 0, collections: stats.collections || 0, objects: stats.objects || 0, isThisTool: true }];
    }
    databases.sort((a, b) => b.used - a.used);
    const totalUsed = databases.reduce((a, d) => a + (d.used || 0), 0);

    return NextResponse.json(
      {
        db: DB_NAME,
        limitBytes: FREE_TIER_LIMIT,
        // This tool only (powers the iPhone-style widget).
        usedBytes: ourUsed,
        dataSize: stats.dataSize || 0,
        storageSize: stats.storageSize || 0,
        indexSize: stats.indexSize || 0,
        percent: Math.min(100, (ourUsed / FREE_TIER_LIMIT) * 100),
        objects: stats.objects || 0,
        collections: stats.collections || 0,
        submissions,
        syncedAt: state ? state.lastSyncAt : null,
        // Whole-cluster view (every app sharing this Atlas cluster).
        databases,
        totalUsedBytes: totalUsed,
        clusterPercent: Math.min(100, (totalUsed / FREE_TIER_LIMIT) * 100),
        listedAll,
      },
      { headers: { "Cache-Control": "private, max-age=30" } }
    );
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
