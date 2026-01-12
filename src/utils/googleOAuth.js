import { google } from "googleapis";
import EmailAccount from "../models/emailAccount.js";

// export const getOAuthClient = () => {
//   console.log("OAUTH CLIENT ID:", process.env.GOOGLE_CLIENT_ID);

//   return new google.auth.OAuth2(
//     process.env.GOOGLE_CLIENT_ID,
//     process.env.GOOGLE_CLIENT_SECRET,
//     process.env.GOOGLE_REDIRECT_URI
//   );
// };
export function getOAuthClient() {
  const oauth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      await EmailAccount.updateOne(
        { refreshToken: oauth.credentials.refresh_token },
        {
          $set: {
            accessToken: tokens.access_token,
            tokenExpiry: new Date(tokens.expiry_date),
            tokenInvalid: false,
          },
        }
      );
    }
  });

  return oauth;
}
