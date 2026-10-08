"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Ring, Bar, Spark, cls, fmtDate, timeAgo, toggleTheme } from "@/app/ui";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [village, setVillage] = useState(null); // open drill-in
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  const flash = useCallback((m) => {
    setToast(m);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/summary", { cache: "no-store" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      setData(await res.json());
      setErr("");
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync?force=1", { method: "POST" });
      const j = await res.json();
      if (!res.ok || j.ok === false) throw new Error(j.error || "Sync failed");
      await load();
      flash(
        j.skipped ? "Already up to date" : `Synced · ${j.submissions} submissions`
      );
    } catch (e) {
      flash("Could not sync: " + (e.message || e));
    } finally {
      setSyncing(false);
    }
  }, [load, flash]);

  function download(fmt) {
    setMenu(false);
    const a = document.createElement("a");
    a.href = `/api/download?format=${fmt}`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    flash(`Preparing ${fmt.toUpperCase()}…`);
  }

  if (loading) {
    return (
      <Shell>
        <div className="center">
          <div className="spin" />
          <div>Loading survey progress…</div>
        </div>
      </Shell>
    );
  }

  if (err && !data) {
    return (
      <Shell>
        <div className="center">
          <div style={{ fontSize: 34 }}>🌾</div>
          <div style={{ maxWidth: 420 }}>
            <b>Couldn&apos;t load data.</b>
            <p className="muted" style={{ color: "var(--muted)", marginTop: 6 }}>
              {err}
            </p>
          </div>
          <button className="btn primary" onClick={refresh} disabled={syncing}>
            {syncing ? "Syncing…" : "Try sync now"}
          </button>
          <Link className="btn" href="/settings">
            Open Settings
          </Link>
        </div>
      </Shell>
    );
  }

  const t = data.totals;
  const villages = [...data.perVillage].sort((a, b) => {
    const pa = a.total ? a.surveyed / a.total : 1;
    const pb = b.total ? b.surveyed / b.total : 1;
    if (pa !== pb) return pa - pb; // least complete first
    return b.total - a.total;
  });

  return (
    <Shell onRefresh={refresh} syncing={syncing}>
      {/* HERO — the 5-second story */}
      <section className="hero">
        <div className="ring">
          <Ring percent={t.percent} caption="surveyed" />
        </div>
        <div className="headline">
          <h1>
            <b className="num">{t.surveyed}</b> of{" "}
            <span className="num">{t.farms}</span> farms surveyed
          </h1>
          <p className="sub">
            {t.pending > 0 ? (
              <>
                <b className="num">{t.pending}</b> farms still to visit across{" "}
                <b className="num">{t.villages}</b> villages.
              </>
            ) : (
              <>All farms surveyed across {t.villages} villages. 🎉</>
            )}
          </p>
          <div className="cta">
            <button className="btn primary" onClick={refresh} disabled={syncing}>
              {syncing ? (
                <>
                  <span className="spin" style={{ width: 15, height: 15, borderWidth: 2 }} />
                  Syncing…
                </>
              ) : (
                <>↻ Refresh data</>
              )}
            </button>
            <div className="rel">
              <button className="btn" onClick={() => setMenu((m) => !m)}>
                ⤓ Download
              </button>
              {menu && (
                <div className="menu" onMouseLeave={() => setMenu(false)}>
                  <button onClick={() => download("xlsx")}>Excel (.xlsx)</button>
                  <button onClick={() => download("csv")}>CSV (.csv)</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* TILES */}
      <div className="tiles">
        <div className="tile">
          <div className="k">🏡 Villages</div>
          <div className="v num">{t.villages}</div>
        </div>
        <div className="tile">
          <div className="k">✅ Surveyed</div>
          <div className="v num">
            {t.surveyed}
            <small> /{t.farms}</small>
          </div>
        </div>
        <div className="tile">
          <div className="k">⏳ Pending</div>
          <div className="v num" style={{ color: "var(--amber)" }}>
            {t.pending}
          </div>
        </div>
        <div className="tile">
          <div className="k">🔁 Returning · 🆕 New</div>
          <div className="v num">
            {t.returning}
            <small> · {t.new}</small>
          </div>
        </div>
      </div>

      {/* VILLAGES */}
      <section className="section">
        <div className="section-head">
          <h2>Villages</h2>
          <span className="hint">Tap a village to see its farms</span>
        </div>
        <div className="vgrid">
          {villages.map((v) => (
            <button
              key={v.code}
              className={cls("vcard", v.pending === 0 && v.total > 0 && "done-all")}
              onClick={() => setVillage(v)}
            >
              <div className="top">
                <span className="name">{v.label}</span>
                <span className="frac num">
                  <b>{v.surveyed}</b>/{v.total}
                </span>
              </div>
              <Bar value={v.surveyed} total={v.total} />
              <div className="meta">
                <span>
                  {v.total ? Math.round((v.surveyed / v.total) * 100) : 0}% done
                </span>
                <span>
                  {v.pending > 0 ? (
                    <span className="badge pending">{v.pending} left</span>
                  ) : v.total > 0 ? (
                    <span className="badge done">complete</span>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ENUMERATORS */}
      {data.leaderboard.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Enumerators</h2>
            <span className="hint">Farms surveyed per person</span>
          </div>
          <Leaderboard rows={data.leaderboard} />
        </section>
      )}

      {/* MOMENTUM */}
      {data.timeline.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Daily submissions</h2>
            <span className="hint">Last 2 weeks</span>
          </div>
          <div className="panel">
            <Spark data={data.timeline} />
          </div>
        </section>
      )}

      {/* DATA QUALITY */}
      <section className="section">
        <div className="section-head">
          <h2>Data checks</h2>
          <span className="hint">Spot issues early</span>
        </div>
        <div className="quality">
          <QCard
            value={data.quality.duplicates.length}
            label="Farms submitted more than once"
          />
          <QCard
            value={data.quality.unlistedIds.length}
            label="Farm IDs not in the master list"
          />
          <QCard value={data.quality.missingGps} label="Submissions missing GPS" />
        </div>
      </section>

      <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 12, marginTop: 28 }}>
        Last synced {timeAgo(data.syncedAt)} · {data.formName || "KoBo form"}
      </p>

      {village && <VillageSheet v={village} onClose={() => setVillage(null)} />}
      {toast && <div className="toast">{toast}</div>}
    </Shell>
  );
}

function Shell({ children, onRefresh, syncing }) {
  return (
    <>
      <header className="appbar">
        <div className="appbar-in">
          <Link href="/" className="brand">
            <span className="logo">🌾</span>
            <span>
              Endline 2026
              <small>Kharif survey progress</small>
            </span>
          </Link>
          <span className="spacer" />
          {onRefresh && (
            <button
              className="iconbtn"
              title="Refresh"
              onClick={onRefresh}
              disabled={syncing}
            >
              ↻
            </button>
          )}
          <button
            className="iconbtn"
            title="Toggle theme"
            onClick={() => toggleTheme()}
          >
            ◑
          </button>
          <Link className="iconbtn" href="/settings" title="Settings">
            ⚙
          </Link>
        </div>
      </header>
      <main className="wrap">{children}</main>
    </>
  );
}

function QCard({ value, label }) {
  return (
    <div className={cls("qcard", value > 0 ? "warn" : "ok")}>
      <div className="v num">{value}</div>
      <div className="k">{label}</div>
    </div>
  );
}

function Leaderboard({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="lb">
      {rows.map((r, i) => (
        <div className="row" key={r.name + i}>
          <span className="rank num">{i + 1}</span>
          <span className="who">{r.name}</span>
          <span className="bars">
            <div className="bar">
              <span style={{ width: (r.count / max) * 100 + "%" }} />
            </div>
          </span>
          <span className="cnt num">{r.count}</span>
        </div>
      ))}
    </div>
  );
}

function VillageSheet({ v, onClose }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h3>{v.label}</h3>
          <span className="badge done">{v.surveyed} done</span>
          {v.pending > 0 && <span className="badge pending">{v.pending} left</span>}
          <span className="spacer" style={{ flex: 1 }} />
          <button className="iconbtn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>
        <div className="sheet-body">
          {v.farms.map((f) => (
            <div className="frow" key={f.id}>
              <span
                className="dot"
                style={{ background: f.done ? "var(--accent)" : "var(--track)" }}
              />
              <div className="fi">
                <div className="fn">{f.farmer || "Unnamed farmer"}</div>
                <div className="fid">{f.id}</div>
              </div>
              <div className="fx">
                {f.done ? (
                  <>
                    <div>
                      <span className="badge done">done</span>{" "}
                      {f.isReturning === false && <span className="badge new">new</span>}
                    </div>
                    <div style={{ marginTop: 3 }}>
                      {f.enumerator || "—"} · {fmtDate(f.date)}
                    </div>
                    {f.loc && (
                      <a
                        href={`https://maps.google.com/?q=${f.loc.lat},${f.loc.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--sky)", fontWeight: 650 }}
                      >
                        📍 map
                      </a>
                    )}
                  </>
                ) : (
                  <span className="badge pending">pending</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
