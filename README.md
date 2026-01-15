# Job Tracker Backend – Gmail Sync & Job Intelligence Engine

This repository contains the backend services for the Job Tracker application.  
It handles Gmail synchronization, email parsing, AI-assisted extraction, and job application lifecycle management.

---

## 🧩 Core Responsibilities

- Gmail OAuth & token management
- Gmail message ingestion
- Email classification & parsing
- Job application creation and updates
- Confidence scoring & deduplication
- AI fallback parsing (rate-limited)

---

## 🔐 Gmail OAuth Flow

1. User initiates Gmail connection from frontend
2. Google OAuth consent screen is shown
3. User explicitly approves:
   > “This app can read your emails”
4. Backend stores:
   - Access token
   - Refresh token
5. Tokens are refreshed automatically on expiry

Expired or invalid tokens are detected and surfaced to the frontend, prompting reconnection.

---

## 📥 Gmail Sync Pipeline

1. Fetch latest Gmail messages
2. Skip already-processed message IDs
3. Extract:
   - Subject
   - Sender
   - Plain text body
   - HTML body
4. Run **heuristic parser**
5. If confidence is low → escalate to **AI parser**
6. Apply updates using confidence-based matching

---

## 🧠 Parsing Strategy

### Heuristic Parsing
- Source-specific parsers (e.g., Indeed)
- Fast, zero-cost, deterministic
- May produce generic outputs

### AI Parsing (Fallback)
- Used only when heuristics are unreliable
- AI becomes the **authoritative source**
- Heuristic data is discarded to prevent contamination
- Rate-limited per sync cycle

---

## 🎯 Confidence-Based Decision Engine

Each email update is classified as:
- `created`
- `updated`
- `soft-updated`
- `ignored`

Confidence factors include:
- Gmail thread matching
- Company name similarity
- Job title similarity
- Recency
- Source reliability

---

## ⚠️ Known Limitations

- Recommendation emails may still appear as applied
- AI parsing limited by daily quota
- Not all ATS formats are fully supported yet

These limitations are **known, tracked, and actively being addressed**.

---

## 🛠 Tech Stack (Backend)

- **Node.js**
- **Express**
- **MongoDB (Mongoose)**
- **Google APIs (gmail v1)**
- **OAuth 2.0**
- **AI parsing service (external)**

---

## 🧪 Planned Enhancements

- Internal ML classifier for email intent detection
- Better recommendation vs applied separation
- Per-user AI budget governance
- Background sync scheduling
- Webhook-based Gmail push notifications

---

## 📄 License

MIT License


