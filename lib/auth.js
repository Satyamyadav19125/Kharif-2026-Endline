import { cookies } from "next/headers";
import { getDb } from "./mongodb";

export const ADMIN_COOKIE = "e26_admin";
export const GUEST_COOKIE = "e26_guest";

// Admin password(s) come from the ADMIN_PASSWORD env var (comma-separated for
// multiple admins). Defaults to "admin" for first run — change it in Vercel.
export function envAdminPasswords() {
  const raw = process.env.ADMIN_PASSWORD || "admin";
  return raw.split(",").map((p) => p.trim()).filter(Boolean);
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

// Guest (read-only viewer): configured in Settings, or via GUEST_PASSWORD env.
export async function getGuestConfig() {
  try {
    const s = await getSettings();
    if (s?.guest && typeof s.guest === "object") return s.guest;
  } catch {}
  const pw = process.env.GUEST_PASSWORD;
  return pw ? { enabled: true, password: pw } : null;
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

export async function getCurrentUser() {
  const store = cookies();
  const a = store.get(ADMIN_COOKIE);
  if (a?.value) {
    const list = await getAdminPasswords();
    if (list.includes(a.value)) return { role: "admin", name: "Admin" };
  }
  const g = store.get(GUEST_COOKIE);
  if (g?.value) {
    const cfg = await getGuestConfig();
    if (cfg && cfg.enabled === true && String(cfg.password || "").trim() === g.value) {
      return { role: "guest", name: "Guest viewer" };
    }
  }
  return null;
}
