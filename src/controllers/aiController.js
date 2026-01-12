// controllers/aiController.js
import { aiParseEmail } from "../services/aiParser.js";

export async function parseEmailWithAI(req, res) {
  try {
    const { subject, from, textBody, htmlBody } = req.body;

    if (!subject && !textBody && !htmlBody) {
      return res.status(400).json({
        message: "Email content is required",
      });
    }

    const parsed = await aiParseEmail({
      subject,
      from,
      textBody,
      htmlBody,
    });

    res.json({
      success: true,
      parsed,
    });
  } catch (err) {
    console.error("AI PARSE ERROR:", err.message);

    res.status(422).json({
      success: false,
      message: "AI parsing failed",
      error: err.message,
    });
  }
}
