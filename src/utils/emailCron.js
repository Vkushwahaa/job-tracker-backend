import cron from "node-cron";
import { syncGmailForUser } from "../services/gmailSyncService.js";

cron.schedule("*/15 * * * *", async () => {
  console.log("Running Gmail sync cron");
  await syncGmailForUser();
});
