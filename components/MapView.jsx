"use client";

import { useEffect, useRef, useState } from "react";

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

const TILES = {
  street: { name: "🗺️ Street", url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: "© OpenStreetMap", maxNativeZoom: 19 },
  satellite: { name: "🛰️ Satellite", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: "Tiles © Esri", maxNativeZoom: 17 },
};
const PALETTE = ["#16a34a", "#0ea5e9", "#f59e0b", "#7c3aed", "#ec4899", "#14b8a6", "#f43f5e", "#64748b", "#a16207", "#2563eb", "#059669", "#db2777", "#4f46e5"];

function loadScript(id, src) {
  return new Promise((resolve, reject) => {
    const ex = document.getElementById(id);
    if (ex) { if (ex.dataset.loaded) return resolve(); ex.addEventListener("load", resolve); ex.addEventListener("error", reject); return; }
    const s = document.createElement("script");
    s.id = id; s.src = src; s.async = true;
    s.onload = () => { s.dataset.loaded = "1"; resolve(); };
    s.onerror = reject;
    document.body.appendChild(s);
  });
}
function loadCss(id, href) {
  if (document.getElementById(id)) return;
  const l = document.createElement("link");
  l.id = id; l.rel = "stylesheet"; l.href = href;
  document.head.appendChild(l);
}
const esc = (s) => String(s ?? "—").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default function MapView({ points = [], allowKoboLink = false }) {
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const tileRef = useRef(null);
  const layerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [layer, setLayer] = useState("street");

  // stable colour per village
  const villages = [...new Set(points.map((p) => p.vcode))];
  const colorOf = (vcode) => PALETTE[Math.max(0, villages.indexOf(vcode)) % PALETTE.length];

  useEffect(() => {
    let cancelled = false;
    loadCss("leaflet-css", LEAFLET_CSS);
    (async () => {
      try {
        await loadScript("leaflet-js", LEAFLET_JS);
        const L = window.L;
        if (cancelled || !boxRef.current || !L || mapRef.current) return;
        const map = L.map(boxRef.current, { preferCanvas: true, zoomControl: true }).setView([30.5, 76.4], 10);
        mapRef.current = map;
        const conf = TILES[layer];
        tileRef.current = L.tileLayer(conf.url, { maxZoom: 19, maxNativeZoom: conf.maxNativeZoom, attribution: conf.attribution }).addTo(map);
        setTimeout(() => { try { map.invalidateSize(); } catch {} }, 250);
        if (!cancelled) setReady(true);
      } catch (e) { console.error("Leaflet failed", e); }
    })();
    return () => { cancelled = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } setReady(false); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // draw markers
  useEffect(() => {
    const map = mapRef.current;
    const L = typeof window !== "undefined" ? window.L : null;
    if (!map || !L || !ready) return;
    if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }
    const markers = [];
    for (const p of points) {
      const dir = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
      const kobo = allowKoboLink ? `<a target="_blank" href="/api/kobo-open?id=${encodeURIComponent(p.id)}" style="background:#0ea5e9;color:#fff;font-size:11px;padding:4px 9px;border-radius:5px;text-decoration:none;">In KoBo</a>` : "";
      const html = `<div style="min-width:190px;font-family:system-ui,sans-serif;">
        <div style="font-weight:700;color:#14532d;">📍 ${esc(p.farmer) || "Farm"}</div>
        <div style="font-size:11px;color:#64748b;margin-bottom:5px;">${esc(p.farm)}</div>
        <table style="width:100%;font-size:12px;">
          <tr><td style="color:#64748b;">Village</td><td>${esc(p.village)}</td></tr>
          <tr><td style="color:#64748b;">Surveyor</td><td>${esc(p.enumerator)}</td></tr>
          <tr><td style="color:#64748b;">Date</td><td>${esc(p.date)}</td></tr>
          <tr><td style="color:#64748b;">Type</td><td>${p.isReturning ? "Returning" : "New"}</td></tr>
        </table>
        <div style="margin-top:7px;display:flex;gap:6px;flex-wrap:wrap;">
          ${kobo}
          <a target="_blank" href="${dir}" style="background:#16a34a;color:#fff;font-size:11px;padding:4px 9px;border-radius:5px;text-decoration:none;">🧭 Directions</a>
        </div></div>`;
      const m = L.circleMarker([p.lat, p.lng], { radius: 7, color: "#fff", weight: 1.5, fillColor: colorOf(p.vcode), fillOpacity: 0.95 });
      m.bindPopup(html);
      markers.push(m);
    }
    const grp = L.layerGroup(markers).addTo(map);
    layerRef.current = grp;
    if (markers.length) {
      try { map.fitBounds(L.featureGroup(markers).getBounds().pad(0.2), { maxZoom: 15 }); } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, ready, allowKoboLink]);

  // tile switch
  useEffect(() => {
    const L = typeof window !== "undefined" ? window.L : null;
    if (!L || !mapRef.current) return;
    if (tileRef.current) mapRef.current.removeLayer(tileRef.current);
    const conf = TILES[layer];
    tileRef.current = L.tileLayer(conf.url, { maxZoom: 19, maxNativeZoom: conf.maxNativeZoom, attribution: conf.attribution }).addTo(mapRef.current);
  }, [layer]);

  return (
    <div className="relative rounded-xl overflow-hidden shadow-sm">
      <div className="absolute top-2 right-2 z-[450] bg-white rounded-lg shadow flex flex-col p-1 gap-0.5">
        {Object.entries(TILES).map(([k, v]) => (
          <button key={k} onClick={() => setLayer(k)}
            className={`text-xs px-2 py-1 rounded text-left whitespace-nowrap ${layer === k ? "bg-field-100 text-field-900 font-semibold" : "hover:bg-slate-100"}`}>{v.name}</button>
        ))}
      </div>
      <div ref={boxRef} style={{ height: "70vh", minHeight: 420, width: "100%" }} />
    </div>
  );
}
