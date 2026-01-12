import cron from "node-cron";
import EmailAccount from "../models/emailAccount.js";
import { syncGmailForUser } from "../services/gmailSyncService.js";

cron.schedule("*/15 * * * *", async () => {
  const accounts = await EmailAccount.find({ autoSyncEnabled: true });

  for (const acc of accounts) {
    try {
      await syncGmailForUser(acc.userId);
    } catch (err) {
      console.error("Cron Gmail sync failed", acc.userId);
    }
  }
});
