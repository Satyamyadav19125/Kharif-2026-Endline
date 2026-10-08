// Turn the universe (villages + farms) and the raw submissions into a small,
// precomputed summary. This runs once per sync and is stored in Mongo, so the
// dashboard only ever reads a few KB — which keeps Vercel egress tiny.

// Read a field by its leaf name, tolerating the KoBo group prefix.
function pick(sub, name) {
  if (sub == null) return undefined;
  if (sub[name] != null) return sub[name];
  const key = Object.keys(sub).find((k) => k === name || k.endsWith("/" + name));
  return key ? sub[key] : undefined;
}

function parseLoc(s) {
  if (!s || typeof s !== "string") return null;
  const [lat, lng] = s.trim().split(/\s+/).map(Number);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  return null;
}

function dayOf(sub) {
  const d = pick(sub, "date") || sub._submission_time || "";
  return String(d).slice(0, 10); // YYYY-MM-DD
}

export function buildSummary(universe, submissions) {
  const { villages, farms, enumerators } = universe;
  const enumLabel = Object.fromEntries((enumerators || []).map((e) => [e.code, e.label]));

  // Map each submission to the farm it covers (first occurrence wins; extras
  // are counted as duplicates). Also track submissions whose farm ID is not in
  // the master list.
  const byFarm = new Map(); // id_farm -> submission info
  const dupCounts = new Map(); // id_farm -> times seen
  let missingGps = 0;
  const unlistedIds = new Set();
  const knownIds = new Set(farms.map((f) => f.id));
  const daily = new Map();

  for (const s of submissions) {
    const id = pick(s, "id_farm");
    const enumCode = pick(s, "name_enu") || "";
    const loc = parseLoc(pick(s, "location"));
    if (!loc) missingGps += 1;
    const day = dayOf(s);
    if (day) daily.set(day, (daily.get(day) || 0) + 1);

    if (id) {
      dupCounts.set(id, (dupCounts.get(id) || 0) + 1);
      if (!knownIds.has(id)) unlistedIds.add(id);
      if (!byFarm.has(id)) {
        byFarm.set(id, {
          submissionId: s._id,
          enumerator: enumLabel[enumCode] || enumCode,
          enumCode,
          farmer: pick(s, "farmer_name") || "",
          date: day,
          submittedAt: s._submission_time || "",
          isReturning: String(pick(s, "is_returning") || "").toLowerCase() === "yes",
          loc,
        });
      }
    }
  }

  // Per-village rollup.
  const villageLabel = Object.fromEntries(villages.map((v) => [v.code, v.label]));
  const farmsByVillage = new Map();
  for (const f of farms) {
    if (!farmsByVillage.has(f.village)) farmsByVillage.set(f.village, []);
    farmsByVillage.get(f.village).push(f);
  }

  const perVillage = villages.map((v) => {
    const list = (farmsByVillage.get(v.code) || []).slice();
    list.sort((a, b) => a.farmer.localeCompare(b.farmer));
    const farmRows = list.map((f) => {
      const hit = byFarm.get(f.id);
      return {
        id: f.id,
        farmer: f.farmer || (hit && hit.farmer) || "",
        done: !!hit,
        enumerator: hit ? hit.enumerator : "",
        date: hit ? hit.date : "",
        isReturning: hit ? hit.isReturning : null,
        loc: hit ? hit.loc : null,
      };
    });
    const surveyed = farmRows.filter((f) => f.done).length;
    return {
      code: v.code,
      label: v.label,
      total: farmRows.length,
      surveyed,
      pending: farmRows.length - surveyed,
      farms: farmRows,
    };
  });

  // Enumerator leaderboard (distinct farms covered).
  const enumCount = new Map();
  for (const [, info] of byFarm) {
    const key = info.enumerator || "Unknown";
    enumCount.set(key, (enumCount.get(key) || 0) + 1);
  }
  const leaderboard = [...enumCount.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // New vs returning (among surveyed farms).
  let returning = 0;
  let fresh = 0;
  for (const [, info] of byFarm) info.isReturning ? (returning += 1) : (fresh += 1);

  // Daily timeline, sorted.
  const timeline = [...daily.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalFarms = farms.length;
  const surveyedFarms = [...byFarm.keys()].filter((id) => knownIds.has(id)).length;
  const duplicates = [...dupCounts.entries()]
    .filter(([, c]) => c > 1)
    .map(([id, count]) => ({ id, count }));

  return {
    totals: {
      villages: villages.length,
      farms: totalFarms,
      surveyed: surveyedFarms,
      pending: Math.max(0, totalFarms - surveyedFarms),
      percent: totalFarms ? Math.round((surveyedFarms / totalFarms) * 100) : 0,
      submissions: submissions.length,
      returning,
      new: fresh,
    },
    perVillage,
    leaderboard,
    timeline,
    quality: {
      unlistedIds: [...unlistedIds],
      duplicates,
      missingGps,
    },
  };
}
