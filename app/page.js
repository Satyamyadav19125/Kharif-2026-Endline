"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppFrame from "@/components/AppFrame";
import ClassicOverview from "@/components/ClassicOverview";
import ModernOverview from "@/components/ModernOverview";

export default function OverviewPage() {
  return <AppFrame>{(user) => <OverviewInner user={user} />}</AppFrame>;
}

function OverviewInner({ user }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [design, setDesign] = useState("classic");

  useEffect(() => {
    try {
      setDesign(localStorage.getItem("endline_design") || "classic");
    } catch {}
  }, []);

  useEffect(() => {
    fetch("/api/summary", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Failed to load");
        return r.json();
      })
      .then(setData)
      .catch((e) => setErr(String(e.message || e)));
  }, []);

  if (err) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-center space-y-3">
        <div className="text-3xl">🌾</div>
        <p className="font-semibold text-slate-900">Couldn&apos;t load data.</p>
        <p className="text-sm text-slate-500">{err}</p>
        <Link href="/settings" className="inline-block px-4 py-2 rounded-lg bg-field-600 text-white font-semibold">Open Settings</Link>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-[50vh] grid place-items-center text-slate-500">
        <div className="text-center space-y-3">
          <div className="spin mx-auto" />
          <div>Loading survey progress…</div>
        </div>
      </div>
    );
  }

  return design === "modern" ? <ModernOverview data={data} user={user} /> : <ClassicOverview data={data} user={user} />;
}
