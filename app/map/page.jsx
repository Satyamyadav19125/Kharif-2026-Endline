"use client";

import { useEffect, useState } from "react";
import AppFrame from "@/components/AppFrame";
import MapView from "@/components/MapView";

export default function MapPage() {
  return <AppFrame>{(user) => <MapInner user={user} />}</AppFrame>;
}

function MapInner({ user }) {
  const [points, setPoints] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/locations", { cache: "no-store" })
      .then(async (r) => { if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Failed"); return r.json(); })
      .then((d) => setPoints(d.points || []))
      .catch((e) => setErr(String(e.message || e)));
  }, []);

  if (err) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">{err}</div>;
  if (!points) return <div className="min-h-[40vh] grid place-items-center"><div className="spin" /></div>;

  const villages = new Set(points.map((p) => p.village)).size;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="text-xl font-bold text-slate-900 flex-1">Map <span className="text-slate-400 text-base num">({points.length} pins)</span></h1>
        <span className="text-sm text-slate-500">Each pin is a surveyed farm · colour = village · {villages} villages</span>
      </div>
      {points.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-slate-500">No submissions have GPS yet.</div>
      ) : (
        <MapView points={points} allowKoboLink={user?.role === "admin"} />
      )}
    </div>
  );
}
