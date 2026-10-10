import { cookies } from "next/headers";
import crypto from "crypto";
import { getDb } from "./mongodb";

export const ADMIN_COOKIE = "e26_admin";
export const GUEST_COOKIE = "e26_guest";
export const USER_COOKIE = "e26_user";

// Admin password(s) come from the ADMIN_PASSWORD env var (comma-separated for
// multiple admins). Defaults to "admin" for first run — change it in Vercel.
export function envAdminPasswords() {
  const raw = process.env.ADMIN_PASSWORD || "admin";
  return raw.split(",").map((p) => p.trim()).filter(Boolean);
}

// A STABLE id for an admin, derived from their password (not its position in
// the list). This means a profile always maps to the same person no matter how
// many passwords exist or what order they're in.
export function adminIdFor(pw) {
  return "a_" + crypto.createHash("sha256").update(String(pw)).digest("hex").slice(0, 16);
}

export async function getSettings() {
  try {
    const db = await getDb();
    return (await db.collection("meta").findOne({ _id: "settings" })) || {};
  } catch {
    return {};
  }
}

async function getAdminPasswords() {
  try {
    const s = await getSettings();
    const list = s?.security?.adminPasswords;
    if (Array.isArray(list)) {
      const clean = list.map((p) => String(p).trim()).filter(Boolean);
      if (clean.length) return clean;
    }
  } catch {}
  return envAdminPasswords();
}

// Surveyor assignments: [{ person, password, villages:[code], phone }].
export async function getAssignments() {
  try {
    const db = await getDb();
    return await db.collection("assignments").find({}).toArray();
  } catch {
    return [];
  }
}
export async function saveAssignments(list) {
  const db = await getDb();
  const col = db.collection("assignments");
  await col.deleteMany({});
  const clean = (Array.isArray(list) ? list : [])
    .map((u) => ({
      person: String(u.person || "").trim(),
      password: String(u.password || "").trim(),
      villages: Array.isArray(u.villages) ? u.villages : [],
      phone: String(u.phone || "").trim(),
    }))
    .filter((u) => u.person);
  if (clean.length) await col.insertMany(clean);
  return clean;
}

// Guest (read-only viewer): configured in Settings, or via GUEST_PASSWORD env.
export async function getGuestConfig() {
  try {
    const s = await getSettings();
    if (s?.guest && typeof s.guest === "object") return s.guest;
  } catch {}
  const pw = process.env.GUEST_PASSWORD;
  return pw ? { enabled: true, password: pw } : null;
}

// Merge a patch into the settings document (used by the Settings page).
export async function saveSettingsPatch(patch) {
  const db = await getDb();
  await db.collection("meta").updateOne({ _id: "settings" }, { $set: patch }, { upsert: true });
}

export async function checkAdminPassword(pw) {
  const list = await getAdminPasswords();
  return !!pw && list.includes(pw);
}
export async function checkGuestPassword(pw) {
  const g = await getGuestConfig();
  if (!g || g.enabled !== true) return false;
  const p = String(g.password || "").trim();
  return p.length > 0 && p === String(pw || "").trim();
}

export { getAdminPasswords };

export async function getCurrentUser() {
  const store = cookies();

  // --- Admin (keyed by a stable hash of the password) ---
  const a = store.get(ADMIN_COOKIE);
  if (a?.value) {
    const list = await getAdminPasswords();
    const idx = list.indexOf(a.value);
    if (idx >= 0) {
      const adminId = adminIdFor(a.value);
      let profiles = {};
      try { profiles = (await getSettings())?.adminProfiles || {}; } catch {}
      // Prefer the stable key; fall back to the legacy index key for profiles
      // saved before this fix (the next save re-keys it to the stable id).
      const profile = profiles[adminId] || profiles[`admin${idx}`] || {};
      return {
        role: "admin",
        adminId,
        name: profile.name || "Admin",
        photo: profile.photo || null,
        bio: profile.bio || null,
        phone: profile.phone || null,
        email: profile.email || null,
      };
    }
  }

  // --- Surveyor ---
  const u = store.get(USER_COOKIE);
  if (u?.value) {
    const sep = u.value.indexOf("::");
    if (sep > 0) {
      const person = u.value.slice(0, sep);
      const token = u.value.slice(sep + 2);
      const list = await getAssignments();
      const found = list.find((x) => x.person === person && x.password && x.password === token);
      if (found) {
        return {
          role: "user",
          name: found.person,
          villages: found.villages || [],
          phone: found.phone || null,
        };
      }
    }
  }

  // --- Guest (read-only viewer) ---
  const g = store.get(GUEST_COOKIE);
  if (g?.value) {
    const cfg = await getGuestConfig();
    if (cfg && cfg.enabled === true && String(cfg.password || "").trim() === g.value) {
      return { role: "guest", name: "Guest viewer" };
    }
  }
  return null;
}
