// // utils/emailClassifier.js
// export function isJobEmail(subject, from) {

//   const keywords = [
//     "application",
//     "applied",
//     "shortlisted",
//     "interview",
//     "rejected",
//     "assessment",
//   ];

//   return keywords.some((k) => subject.toLowerCase().includes(k));
// }
export function isJobEmail(subject = "", from = "") {
  const s = subject.toLowerCase();
  const f = from.toLowerCase();

  return (
    s.includes("application") ||
    s.includes("applied") ||
    s.includes("interview") ||
    f.includes("indeed") ||
    f.includes("naukri") ||
    f.includes("internshala")
  );
}
