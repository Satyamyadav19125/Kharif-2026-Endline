"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Ring, fmtBytes, timeAgo, toggleTheme } from "@/app/ui";

export default function Settings() {
  const [status, setStatus] = useState(null);
  const [db, setDb] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState("");

  const loadAll = useCallback(async () => {
    const [s, d] = await Promise.allSettled([
      fetch("/api/status", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/dbstats", { cache: "no-store" }).then((r) => r.json()),
    ]);
    if (s.status === "fulfilled") setStatus(s.value);
    if (d.status === "fulfilled") setDb(d.value);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const sync = useCallback(async () => {
    setSyncing(true);
    setMsg("");
    try {
      const r = await fetch("/api/sync?force=1", { method: "POST" });
      const j = await r.json();
      if (!r.ok || j.ok === false) throw new Error(j.error || "Sync failed");
      setMsg(j.skipped ? "Already up to date." : `Synced ${j.submissions} submissions.`);
      await loadAll();
    } catch (e) {
      setMsg("Error: " + (e.message || e));
    } finally {
      setSyncing(false);
    }
  }, [loadAll]);

  const pct = db && !db.error ? db.percent : 0;

  return (
    <>
      <header className="appbar">
        <div className="appbar-in">
          <Link href="/" className="brand">
            <span className="logo">🌾</span>
            <span>
              Settings
              <small>Endline 2026</small>
            </span>
          </Link>
          <span className="spacer" />
          <button className="iconbtn" title="Toggle theme" onClick={() => toggleTheme()}>
            ◑
          </button>
          <Link className="iconbtn" href="/" title="Back to dashboard">
            ✕
          </Link>
        </div>
      </header>

      <main className="wrap">
        <div className="settings">
          {/* KoBo connection */}
          <div className="panel">
            <h2>KoBo connection</h2>
            <p className="muted">Where this dashboard pulls its data from.</p>
            <div style={{ marginTop: 12 }}>
              <div className="kv">
                <span className="kk">Status</span>
                <span className="vv">
                  {!status ? (
                    "Checking…"
                  ) : status.kobo ? (
                    <span className="statusdot" style={{ color: "var(--primary)" }}>
                      <span className="dot" style={{ background: "var(--accent)" }} /> Connected
                    </span>
                  ) : (
                    <span className="statusdot" style={{ color: "var(--danger)" }}>
                      <span className="dot" style={{ background: "var(--danger)" }} /> Not connected
                    </span>
                  )}
                </span>
              </div>
              <div className="kv">
                <span className="kk">Form</span>
                <span className="vv">{status?.formName || status?.form || "—"}</span>
              </div>
              <div className="kv">
                <span className="kk">Submissions on KoBo</span>
                <span className="vv num">{status?.koboCount ?? "—"}</span>
              </div>
              <div className="kv">
                <span className="kk">API token</span>
                <span className="vv">{status?.tokenSet ? "set ✓" : "missing ✗"}</span>
              </div>
              {status?.koboError && (
                <div className="kv">
                  <span className="kk">Error</span>
                  <span className="vv" style={{ color: "var(--danger)" }}>
                    {status.koboError}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* iPhone-style MongoDB storage widget */}
          <div className="panel">
            <h2>Database storage</h2>
            <p className="muted">Live usage of your MongoDB Atlas free tier (512 MB).</p>
            <div style={{ display: "grid", placeItems: "center", marginTop: 16 }}>
              <div className="ioswidget">
                <div className="wtop">
                  <span className="leaf">🍃</span> MongoDB Atlas
                </div>
                <div className="wmid">
                  <Ring percent={pct} size={78} stroke={9} caption="used" />
                  <div>
                    <div className="wval num">
                      {db && !db.error ? fmtBytes(db.usedBytes) : "—"}
                      <small> / 512 MB</small>
                    </div>
                    <div className="wsub">
                      {db && !db.error
                        ? `${pct.toFixed(pct < 1 ? 2 : 1)}% of free storage`
                        : db?.error || "Loading…"}
                    </div>
                  </div>
                </div>
                <div className="wgrid">
                  <div>
                    <div className="kk">Submissions</div>
                    <div className="vv num">{db?.submissions ?? "—"}</div>
                  </div>
                  <div>
                    <div className="kk">Documents</div>
                    <div className="vv num">{db?.objects ?? "—"}</div>
                  </div>
                  <div>
                    <div className="kk">Indexes</div>
                    <div className="vv num">{db ? fmtBytes(db.indexSize) : "—"}</div>
                  </div>
                  <div>
                    <div className="kk">Last sync</div>
                    <div className="vv">{db ? timeAgo(db.syncedAt) : "—"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sync controls */}
          <div className="panel">
            <h2>Sync</h2>
            <p className="muted">
              Pull the latest submissions from KoBo into the dashboard. This also runs
              automatically once a day.
            </p>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 14, flexWrap: "wrap" }}>
              <button className="btn primary" onClick={sync} disabled={syncing}>
                {syncing ? "Syncing…" : "↻ Sync now"}
              </button>
              <span className="muted" style={{ color: "var(--muted)", fontSize: 13 }}>
                Last synced {timeAgo(status?.syncedAt || db?.syncedAt)}
              </span>
            </div>
            {msg && (
              <p style={{ marginTop: 12, fontWeight: 650, color: "var(--primary)" }}>{msg}</p>
            )}
          </div>

          {/* Mongo health */}
          <div className="panel">
            <h2>System</h2>
            <div style={{ marginTop: 8 }}>
              <div className="kv">
                <span className="kk">MongoDB</span>
                <span className="vv">
                  {!status ? (
                    "Checking…"
                  ) : status.mongo ? (
                    <span className="statusdot" style={{ color: "var(--primary)" }}>
                      <span className="dot" style={{ background: "var(--accent)" }} /> Connected
                    </span>
                  ) : (
                    <span className="statusdot" style={{ color: "var(--danger)" }}>
                      <span className="dot" style={{ background: "var(--danger)" }} /> Error
                    </span>
                  )}
                </span>
              </div>
              <div className="kv">
                <span className="kk">Database</span>
                <span className="vv">{db?.db || "endline2026"}</span>
              </div>
              <div className="kv">
                <span className="kk">Server</span>
                <span className="vv">{status?.base || "—"}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
