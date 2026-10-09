"use client";

import { useRef, useState } from "react";

// Resize an image to a small JPEG data URL (stored directly in the profile).
function resizeImage(file, maxDim = 512, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) { height = Math.round((height * maxDim) / width); width = maxDim; }
        else if (height > maxDim) { width = Math.round((width * maxDim) / height); height = maxDim; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        if ("imageSmoothingQuality" in ctx) ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PhotoUpload({ value, onChange, label = "Photo" }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const fileRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null); setBusy(true);
    try {
      let url = await resizeImage(file, 512, 0.85);
      if (url.length > 900000) url = await resizeImage(file, 384, 0.8);
      onChange(url);
    } catch (e2) {
      setErr(e2.message || "Could not load image");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
      <div className="flex items-center gap-3">
        {value ? (
          <img src={value} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-field-200" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-field-100 to-earth-100 flex items-center justify-center text-xl">👤</div>
        )}
        <div className="flex flex-col gap-1">
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy}
            className="px-3 py-1.5 text-xs bg-field-600 text-white rounded-lg hover:bg-field-700 disabled:bg-slate-300">
            {busy ? "Loading…" : value ? "Change photo" : "📷 Upload photo"}
          </button>
          {value && <button type="button" onClick={() => onChange("")} className="px-3 py-1.5 text-xs text-red-600 hover:underline text-left">Remove</button>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>
      {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
    </div>
  );
}
