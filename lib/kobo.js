// Thin KoBoToolbox API client + helpers to build the "universe" of villages
// and farms (the denominator) from the form definition.

export function koboBase() {
  return (process.env.KOBO_BASE || "https://kf.kobotoolbox.org").replace(/\/+$/, "");
}
export function koboToken() {
  return process.env.KOBO_TOKEN || "";
}
export function koboForm() {
  return process.env.KOBO_FORM || "a8moiXkkGSokVURs4yXXg2";
}

// First translation / plain string -> string.
export function label(v) {
  if (Array.isArray(v)) return v.find((x) => x != null) ?? "";
  return v == null ? "" : String(v);
}

async function koboGet(url) {
  const token = koboToken();
  if (!token) throw new Error("KOBO_TOKEN is not set");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Token ${token}`, Accept: "application/json" },
      cache: "no-store",
      signal: ctrl.signal,
    });
    if (!res.ok) {
      throw new Error(`KoBo ${res.status} ${res.statusText} for ${url}`);
    }
    return res.json();
  } finally {
    clearTimeout(t);
  }
}

// Fetch the form definition (survey + choices + name).
export async function fetchAsset() {
  const url = `${koboBase()}/api/v2/assets/${koboForm()}.json`;
  const a = await koboGet(url);
  return {
    name: a.name || "KoBo form",
    submissionCount: a.deployment__submission_count ?? null,
    content: a.content || {},
  };
}

// Split "Farmer Name — FARM_ID" style labels into {farmer, rest}.
function splitFarmLabel(text, id) {
  const s = label(text).trim();
  const parts = s.split(/\s[—–-]\s/); // em dash / en dash / hyphen with spaces
  if (parts.length >= 2) return { farmer: parts[0].trim(), label: s };
  // fall back: strip a trailing id if present
  if (id && s.endsWith(id)) return { farmer: s.slice(0, -id.length).replace(/[—–-]\s*$/, "").trim(), label: s };
  return { farmer: s, label: s };
}

// Build the master lists of villages and farms from the form's choices.
export function buildUniverse(content) {
  const choices = content.choices || [];
  const survey = content.survey || [];

  const villages = [];
  const villageSeen = new Set();
  const farms = [];
  const enumerators = [];
  const enumSeen = new Set();
  // choiceMap[list_name][name] = human label — used to decode coded answers
  // into readable text in the download.
  const choiceMap = {};

  for (const c of choices) {
    const list = c.list_name;
    const lab = label(c.label) || c.name;
    if (list) {
      (choiceMap[list] = choiceMap[list] || {})[c.name] = lab;
    }
    if (list === "village") {
      if (villageSeen.has(c.name)) continue;
      villageSeen.add(c.name);
      villages.push({ code: c.name, label: lab });
    } else if (list === "farm") {
      const id = c.name;
      const { farmer, label: fl } = splitFarmLabel(c.label, id);
      farms.push({ id, village: c.village || "", farmer, label: fl });
    } else if (list === "names") {
      if (enumSeen.has(c.name)) continue;
      enumSeen.add(c.name);
      enumerators.push({ code: c.name, label: lab });
    }
  }

  // A lookup of question labels (used as friendly headers in the download).
  const fieldLabels = {};
  for (const q of survey) {
    const n = q.name || q.$autoname;
    if (n) fieldLabels[n] = label(q.label) || n;
  }

  return { villages, farms, fieldLabels, enumerators, choiceMap };
}

// Fetch every submission, following KoBo's paginated "next" links.
export async function fetchAllSubmissions() {
  let url = `${koboBase()}/api/v2/assets/${koboForm()}/data.json?limit=5000`;
  const all = [];
  let guard = 0;
  while (url && guard < 100) {
    guard += 1;
    const page = await koboGet(url);
    if (Array.isArray(page.results)) all.push(...page.results);
    url = page.next || null;
  }
  return all;
}
