import jobApplication from "./jobApplication";

await JobApplication.updateMany({ companyName: { $exists: true } }, [
  {
    $set: {
      company: { name: "$companyName" },
      job: { title: "$jobTitle" },
    },
  },
  {
    $unset: ["companyName", "jobTitle", "applyDate", "jobLink"],
  },
]);
