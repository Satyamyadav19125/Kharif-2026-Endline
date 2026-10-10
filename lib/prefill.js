// Build a KoBo/Enketo "new submission" URL with fields pre-filled for one farm.
// Enketo accepts ?d[field_path]=value params that pre-populate matching
// questions, so from a pending farm we can hand the surveyor a link that already
// has the village, farm ID, their name and today's date — they just fill the
// rest. Field paths match the Endline form's question names.

const PATHS = {
  village: "orientation/village",
  id_farm: "orientation/id_farm",
  name_enu: "orientation/name_enu",
  date: "orientation/date",
  start_time: "orientation/start_time",
};

function koboTimeNow() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  const offMin = -d.getTimezoneOffset();
  const sign = offMin >= 0 ? "+" : "-";
  const oh = p(Math.floor(Math.abs(offMin) / 60));
  const om = p(Math.abs(offMin) % 60);
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.000${sign}${oh}:${om}`;
}

// values: { village, id_farm, name_enu }
export function buildPrefillUrl(baseUrl, values = {}) {
  if (!baseUrl) return null;
  const today = new Date().toISOString().slice(0, 10);
  const params = [];
  const add = (path, val) => {
    if (path && val != null && String(val).trim() !== "") {
      params.push(`d[${encodeURIComponent(path)}]=${encodeURIComponent(val)}`);
    }
  };
  add(PATHS.village, values.village);
  add(PATHS.id_farm, values.id_farm);
  add(PATHS.name_enu, values.name_enu);
  add(PATHS.date, today);
  add(PATHS.start_time, koboTimeNow());
  if (!params.length) return baseUrl;
  return `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}${params.join("&")}`;
}
