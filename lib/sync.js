import { getDb } from "./mongodb";
import { fetchAsset, fetchAllSubmissions, buildUniverse } from "./kobo";
import { buildSummary } from "./aggregate";

// Don't let rapid clicks or overlapping cron runs hammer KoBo.
const COOLDOWN_MS = 30 * 1000;

async function getState(db) {
  return (await db.collection("meta").findOne({ _id: "state" })) || {};
}

// Pull everything from KoBo, mirror it into Mongo, and precompute the summary.
export async function runSync({ force = false } = {}) {
  const db = await getDb();
  const state = await getState(db);
  const now = Date.now();
  if (
    !force &&
    state.lastSyncAt &&
    now - new Date(state.lastSyncAt).getTime() < COOLDOWN_MS
  ) {
    return { ok: true, skipped: true, ...(state.lastCounts || {}), syncedAt: state.lastSyncAt };
  }

  const asset = await fetchAsset();
  const universe = buildUniverse(asset.content);
  const submissions = await fetchAllSubmissions();

  // Mirror submissions into Mongo, keyed by KoBo's _id. A full reconcile
  // (upsert present + delete missing) keeps us in step with KoBo edits/deletes.
  const col = db.collection("submissions");
  const ids = submissions.map((s) => s._id);
  if (ids.length) {
    const ops = submissions.map((s) => ({
      replaceOne: {
        filter: { _id: s._id },
        replacement: { ...s, _syncedAt: new Date() },
        upsert: true,
      },
    }));
    await col.bulkWrite(ops, { ordered: false });
    await col.deleteMany({ _id: { $nin: ids } });
  } else {
    await col.deleteMany({});
  }

  const summary = buildSummary(universe, submissions);
  summary.formName = asset.name;
  summary.syncedAt = new Date().toISOString();

  const meta = db.collection("meta");
  const counts = {
    villages: universe.villages.length,
    farms: universe.farms.length,
    submissions: submissions.length,
  };
  await meta.replaceOne({ _id: "universe" }, { _id: "universe", ...universe, at: new Date() }, { upsert: true });
  await meta.replaceOne({ _id: "summary" }, { _id: "summary", summary, at: new Date() }, { upsert: true });
  await meta.replaceOne(
    { _id: "state" },
    { _id: "state", lastSyncAt: summary.syncedAt, lastCounts: counts },
    { upsert: true }
  );

  return { ok: true, skipped: false, ...counts, syncedAt: summary.syncedAt };
}

// Read the stored summary; on a cold database, sync once to populate it.
export async function getSummaryDoc({ syncIfMissing = true } = {}) {
  const db = await getDb();
  const doc = await db.collection("meta").findOne({ _id: "summary" });
  if (doc && doc.summary) return doc.summary;
  if (syncIfMissing) {
    await runSync({ force: true });
    const d2 = await db.collection("meta").findOne({ _id: "summary" });
    return d2 && d2.summary ? d2.summary : null;
  }
  return null;
}
