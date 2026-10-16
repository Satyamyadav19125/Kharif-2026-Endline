"use client";

import { useEffect, useState } from "react";
import { Ring, fmtBytes, timeAgo } from "@/app/ui";

// iPhone-home-screen-style widget showing live MongoDB Atlas storage usage.
// Pass `data` to reuse a parent's /api/dbstats fetch, or let it fetch its own.
export default function StorageWidget({ data }) {
  const [fetched, setFetched] = useState(null);
  useEffect(() => {
    if (data) return;
    fetch("/api/dbstats", { cache: "no-store" })
      .then((r) => r.json())
      .then(setFetched)
      .catch(() => {});
  }, [data]);
  const db = data || fetched;
  const ok = db && !db.error;
  const pct = ok ? db.percent : 0;

  return (
    <div className="ioswidget">
      <div className="wtop">
        <span className="leaf">🍃</span> MongoDB Atlas
      </div>
      <div className="wmid">
        <Ring percent={pct} size={78} stroke={9} caption="used" trackColor="rgba(255,255,255,0.14)" />
        <div>
          <div className="wval num">
            {ok ? fmtBytes(db.usedBytes) : "—"}
            <small> / 512 MB</small>
          </div>
          <div className="wsub">
            {ok ? `${pct.toFixed(pct < 1 ? 2 : 1)}% of free storage` : db?.error || "Loading…"}
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
          <div className="vv num">{ok ? fmtBytes(db.indexSize) : "—"}</div>
        </div>
        <div>
          <div className="kk">Last sync</div>
          <div className="vv">{db ? timeAgo(db.syncedAt) : "—"}</div>
        </div>
      </div>
    </div>
  );
}
