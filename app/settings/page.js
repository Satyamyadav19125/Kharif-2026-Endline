"use client";

import { useEffect, useState, useCallback } from "react";
import AppFrame from "@/components/AppFrame";
import StorageWidget from "@/components/StorageWidget";
import { timeAgo, toggleTheme } from "@/app/ui";

export default function SettingsPage() {
  return <AppFrame>{(user) => <SettingsInner user={user} />}</AppFrame>;
}

function SettingsInner({ user }) {
  const [design, setDesign] = useState("classic");
  const [dark, setDark] = useState(false);
  const [status, setStatus] = useState(null);
  const [cfg, setCfg] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState("");
  const [guestEnabled, setGuestEnabled] = useState(false);
  const [guestPw, setGuestPw] = useState("");

  useEffect(() => {
    try {
      setDesign(localStorage.getItem("endline_design") || "classic");
      setDark(document.documentElement.classList.contains("dark"));
    } catch {}
  }, []);

  const load = useCallback(() => {
    fetch("/api/status", { cache: "no-store" }).then((r) => r.json()).then(setStatus).catch(() => {});
    fetch("/api/settings", { cache: "no-store" }).then((r) => r.json()).then((d) => {
      setCfg(d);
      setGuestEnabled(!!d?.guest?.enabled);
    }).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  function pickDesign(d) {
    setDesign(d);
    try { localStorage.setItem("endline_design", d); } catch {}
    setMsg(`Overview design set to ${d === "modern" ? "Modern" : "Classic"}.`);
  }

  async function sync() {
    setSyncing(true); setMsg("");
    try {
      const r = await fetch("/api/sync?force=1", { method: "POST" });
      const j = await r.json();
      if (!r.ok || j.ok === false) throw new Error(j.error || "Sync failed");
      setMsg(j.skipped ? "Already up to date." : `Synced ${j.submissions} submissions.`);
      load();
    } catch (e) { setMsg("Error: " + (e.message || e)); }
    finally { setSyncing(false); }
  }

  async function saveGuest() {
    setMsg("");
    const r = await fetch("/api/settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guest: { enabled: guestEnabled, password: guestPw } }),
    });
    if (r.ok) { setMsg("Guest access saved."); setGuestPw(""); load(); }
    else setMsg("Could not save guest access.");
  }

  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-bold text-slate-900">Settings</h1>

      {/* Design theme */}
      <Panel title="Dashboard design" subtitle="Choose how the Overview page looks.">
        <div className="inline-flex bg-slate-100 rounded-xl p-1 gap-1">
          <SegBtn on={design === "classic"} onClick={() => pickDesign("classic")}>📊 Classic</SegBtn>
          <SegBtn on={design === "modern"} onClick={() => pickDesign("modern")}>⭕ Modern</SegBtn>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          <b>Classic</b> matches the Pipe & Water-Meter tools (KPI tiles + charts). <b>Modern</b> is the big progress-ring dashboard.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm text-slate-600">Dark mode</span>
          <button onClick={() => setDark(toggleTheme() === "dark")}
            className={`w-12 h-7 rounded-full transition relative ${dark ? "bg-field-600" : "bg-slate-300"}`}>
            <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-all ${dark ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
      </Panel>

      {/* KoBo connection */}
      <Panel title="KoBo connection" subtitle="Where the data comes from.">
        <Row k="Status" v={!status ? "Checking…" : status.kobo
          ? <Dot ok>Connected</Dot> : <Dot>Not connected</Dot>} />
        <Row k="Form" v={status?.formName || status?.form || "—"} />
        <Row k="Submissions on KoBo" v={status?.koboCount ?? "—"} />
        <Row k="API token" v={status?.tokenSet ? "set ✓" : "missing ✗"} />
        {status?.koboError && <Row k="Error" v={<span className="text-red-600">{status.koboError}</span>} />}
      </Panel>

      {/* Mongo storage widget */}
      <Panel title="Database storage" subtitle="Live MongoDB Atlas usage (free tier = 512 MB).">
        <div className="grid place-items-center"><StorageWidget /></div>
      </Panel>

      {/* Sync */}
      <Panel title="Sync" subtitle="Pull the latest submissions. Also runs automatically once a day.">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={sync} disabled={syncing}
            className="px-4 py-2 rounded-lg bg-field-600 text-white font-semibold hover:opacity-90 disabled:opacity-50">
            {syncing ? "Syncing…" : "↻ Sync now"}
          </button>
          <span className="text-sm text-slate-500">Last synced {timeAgo(status?.syncedAt)}</span>
        </div>
        {msg && <p className="text-sm text-field-700 font-medium mt-3">{msg}</p>}
      </Panel>

      {/* Guest access (admin only) */}
      {isAdmin && (
        <Panel title="Guest viewer" subtitle="A read-only password for people who should only view (no download).">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={guestEnabled} onChange={(e) => setGuestEnabled(e.target.checked)} />
            Enable a read-only guest password
          </label>
          {guestEnabled && (
            <div className="mt-2 flex gap-2 flex-wrap">
              <input type="text" value={guestPw} onChange={(e) => setGuestPw(e.target.value)}
                placeholder={cfg?.guest?.hasPassword ? "Set a new password…" : "Guest password"}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm flex-1 min-w-[160px]" />
            </div>
          )}
          <button onClick={saveGuest} className="mt-3 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold">Save guest access</button>
          <p className="text-xs text-slate-500 mt-2">Admin password is set with the <code className="bg-slate-100 px-1 rounded">ADMIN_PASSWORD</code> environment variable in Vercel.</p>
        </Panel>
      )}

      <Panel title="System">
        <Row k="MongoDB" v={!status ? "Checking…" : status.mongo ? <Dot ok>Connected</Dot> : <Dot>Error</Dot>} />
        <Row k="Database" v="endline2026" />
        <Row k="Server" v={status?.base || "—"} />
        <Row k="You" v={`${user?.name} (${user?.role})`} />
      </Panel>
    </div>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5">
      <h2 className="font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="text-xs text-slate-500 mb-3">{subtitle}</p>}
      {children}
    </div>
  );
}
function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-3 py-2 border-t border-slate-100 first:border-t-0 text-sm">
      <span className="text-slate-500">{k}</span>
      <span className="font-medium text-right break-words">{v}</span>
    </div>
  );
}
function SegBtn({ on, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${on ? "bg-white shadow text-slate-900" : "text-slate-500"}`}>
      {children}
    </button>
  );
}
function Dot({ ok, children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold ${ok ? "text-field-700" : "text-red-600"}`}>
      <span className="w-2 h-2 rounded-full" style={{ background: ok ? "#16a34a" : "#dc2626" }} />
      {children}
    </span>
  );
}
