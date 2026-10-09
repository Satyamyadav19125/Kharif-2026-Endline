"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Landing() {
  const [d, setD] = useState(null);
  useEffect(() => {
    fetch("/api/landing", { cache: "no-store" }).then((r) => r.json()).then(setD).catch(() => setD({}));
  }, []);

  const project = d?.project || {};
  const contact = d?.contact || {};
  const counts = d?.counts;
  const name = project.name || "Kharif 2026 Endline Survey";
  const tagline = project.tagline || "End-of-season survey progress & analytics dashboard";
  const description =
    project.description ||
    "A live dashboard for the Kharif 2026 Endline survey — tracking how many farms have been surveyed across every village, with enumerator progress, irrigation and crop analytics, data-quality checks, and clean one-click exports.";

  const features = [
    { icon: "📊", title: "Live progress", body: "See exactly how many farms are surveyed out of the full list, village by village, updated from KoBo." },
    { icon: "🏡", title: "Village & enumerator view", body: "Drill into any village to see which farms are done and which are pending, and who surveyed what." },
    { icon: "⤓", title: "Clean exports", body: "Download Excel/CSV with just the fields surveyors fill in, plus a Summary sheet of every analytic." },
  ];

  const people = Array.isArray(contact.people) ? contact.people.filter((p) => p && (p.name || p.email || p.phone)) : [];
  const showContact = contact.showOnLanding !== false && people.length > 0;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-hero-gradient text-white shadow-xl">
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <path d="M0,410 Q200,360 400,410 T800,410 L800,500 L0,500 Z" fill="white" />
          <path d="M0,440 Q200,390 400,440 T800,440 L800,500 L0,500 Z" fill="white" opacity="0.5" />
          {[120, 280, 440, 600, 720].map((x, i) => (
            <g key={i} transform={`translate(${x}, 440)`}>
              <line x1="0" y1="0" x2="0" y2="-90" stroke="white" strokeWidth="2" />
              {[-70, -58, -46, -34, -22].map((y, j) => (
                <g key={j}>
                  <ellipse cx="-6" cy={y} rx="4" ry="7" fill="white" transform={`rotate(-28 -6 ${y})`} />
                  <ellipse cx="6" cy={y} rx="4" ry="7" fill="white" transform={`rotate(28 6 ${y})`} />
                </g>
              ))}
            </g>
          ))}
        </svg>

        <div className="relative p-6 sm:p-10 md:p-14">
          <div className="text-5xl mb-4">🌾</div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-3">{name}</h1>
          <p className="text-base sm:text-lg text-white/90 mb-4 max-w-2xl">{tagline}</p>
          {counts && (
            <div className="flex items-center gap-2 text-sm text-white/85 mb-6 flex-wrap">
              <span>🏡 {counts.villages} villages</span>
              <span className="opacity-50">·</span>
              <span>🌾 {counts.farms} farms in the survey list</span>
            </div>
          )}
          <Link href="/login" className="inline-flex items-center gap-2 bg-white text-field-800 px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-field-50 transition">
            🔑 Log in to dashboard
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </section>

      {/* About */}
      <section className="bg-white rounded-2xl shadow p-6 sm:p-8">
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2"><span className="text-2xl">🌱</span> About</h2>
        <p className="text-slate-700 leading-relaxed">{description}</p>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {features.map((f, i) => (
          <div key={i} className="bg-white rounded-xl shadow p-5">
            <div className="text-3xl mb-2">{f.icon}</div>
            <h3 className="font-semibold mb-1 text-slate-900">{f.title}</h3>
            <p className="text-sm text-slate-600">{f.body}</p>
          </div>
        ))}
      </section>

      {/* Contact */}
      {showContact && (
        <section className="bg-white rounded-2xl shadow p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2"><span className="text-2xl">📬</span> Get in touch</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {people.map((p, i) => (
              <div key={i} className="border border-slate-200 rounded-xl p-4">
                <div className="font-semibold text-slate-900">{p.name || "Contact"}</div>
                {p.designation && <div className="text-xs text-field-700 font-medium mb-1.5">{p.designation}</div>}
                <div className="space-y-1 text-sm">
                  {p.phone && <p>📞 <a href={`tel:${p.phone}`} className="text-field-700 hover:underline">{p.phone}</a></p>}
                  {p.email && <p>✉️ <a href={`mailto:${p.email}`} className="text-field-700 hover:underline break-all">{p.email}</a></p>}
                  {p.whatsapp && <p>💬 <a href={`https://wa.me/${String(p.whatsapp).replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer" className="text-field-700 hover:underline">WhatsApp</a></p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
