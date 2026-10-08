"use client";

import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      window.location.href = "/";
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-7">
          <div className="text-center mb-5">
            <div className="text-4xl mb-2">🌾</div>
            <h1 className="text-2xl font-extrabold text-slate-900">Endline 2026</h1>
            <p className="text-sm text-slate-500 mt-1">Kharif survey progress · log in to continue</p>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Password</label>
              <input type="password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-field-400"
                required />
            </div>

            {error && <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-sm text-red-800">{error}</div>}

            <button type="submit" disabled={loading || !password}
              className="w-full bg-gradient-to-r from-field-600 to-field-700 text-white py-2.5 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition">
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>

          <p className="mt-5 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
            Admin uses the master password.<br />
            Viewers use the read-only password.
          </p>
        </div>
        <p className="text-center text-white/70 text-xs mt-4">🌾 Kharif 2026 Endline Survey</p>
      </div>
    </div>
  );
}
