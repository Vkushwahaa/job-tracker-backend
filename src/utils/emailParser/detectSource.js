// utils/emailParser/detectSource.js
export function detectSource({ from = "", subject = "" }) {
  const f = (from || "").toLowerCase();
  const s = (subject || "").toLowerCase();

  if (f.includes("indeed") || s.includes("indeed")) return "indeed";
  if (f.includes("naukri") || s.includes("naukri")) return "naukri";
  if (f.includes("internshala") || s.includes("internshala"))
    return "internshala";
  if (f.includes("workable") || s.includes("workable")) return "workable";
  if (f.includes("greenhouse") || s.includes("greenhouse")) return "greenhouse";
  return "generic";
}
