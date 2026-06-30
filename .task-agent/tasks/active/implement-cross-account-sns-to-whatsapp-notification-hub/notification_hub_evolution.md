# Notification Hub Evolution – Architectural Options

## 1️⃣ Multi‑Topic / Multi‑Account Routing
- **Current state** – One Pushover API token stored in `.env` and used for all alerts.
- **Goal** – Send alerts to different Pushover *applications* (each has its own API token) based on the originating AWS account.
- **Approach**
  - Add a JSON map to `config/config.json` (or a new `pushoverAccountTokens` map) that links an AWS account ID to a distinct Pushover API token.
  - In the Lambda router (`lambda/index.js`) look up `record.EventSourceArn` → extract the **account ID** from the ARN (`arn:aws:sns:us-east-1:123456789012:…`).
  - Select the token from the map and include it in the HTTP request to Pushover.  If no entry exists, fall back to the default token.
  - This change is **purely server‑side** – client accounts do not need to know about the mapping.

## 2️⃣ Native Android “Bubble” Notifications
- **Google restrictions** – Bubbles are only allowed for *conversation‑style* notifications that originate from a foreground activity or a direct reply service.  Apps must register a `ShortcutInfo` and have a persistent notification channel.
- **What this means for us**
  - A custom app **can** show bubbles, but it must implement the required conversation APIs.  The restriction is not a hard block; it is a design rule that we must follow.
  - We cannot simply push a generic bubble from a background service without a conversation context; the Android OS will drop it.
- **Implementation path**
  1. **Create a lightweight Android app** (Kotlin/Java) that registers a permanent “notification hub” conversation shortcut.
  2. Use **Firebase Cloud Messaging (FCM)** as the push transport (AWS SNS → Platform Application → FCM → device).
  3. When a payload arrives, the app builds a `NotificationCompat.Builder` with `setBubbleMetadata()` and posts it to the system.  The bubble appears over any other UI, exactly what you’re looking for.
  4. The app can also expose a small UI to let the user assign a *Pushover‑style* priority (`critical`, `high`, etc.) which we forward back to the backend if needed.

## 3️⃣ Open‑Source Federated Chat (Matrix/Element) as an Alternative
- **Matrix** supports “push” via FCM and can render true conversation bubbles when paired with the official Android client (Element).
- Deploy a **Matrix homeserver** (Synapse) on AWS (Fargate or EC2).  Your Lambda can POST messages to the `/rooms/{roomId}/send/m.room.message` endpoint.
- Benefit: No custom Android app required – the existing client already handles bubbles and read receipts.
- Drawback: More operational overhead (homeserver maintenance, federation rules).

## 4️⃣ Push‑to‑Talk (PTT) Concept
- **Core idea** – A low‑latency audio stream triggered from a notification.
- **AWS building blocks**
  1. **Amazon Kinesis Video Streams** – ingest short audio clips (e.g., 5‑10 s) from the source device.
  2. **AWS Transcribe** (optional) – turn speech into text for fallback display.
  3. **SNS → Lambda** – when a “PTT request” SNS message arrives, the Lambda creates a signed URL for the Kinesis stream and pushes a push notification to the Android app (via FCM) containing that URL.
  4. **Android app** – opens a `MediaPlayer` streaming the KVS endpoint, with UI that shows the bubble and a “hold‑to‑talk” button.
- **Latency** – Kinesis Video provides sub‑second latency; combined with FCM push (< 1 s) the round‑trip can be < 2 s, which is acceptable for most PTT use‑cases.

## 5️⃣ Recommendations – What to Build First
| Priority | Work Item | Reason |
|---|---|---|
| ⭐️ High | Add `pushoverAccountTokens` map and account‑ID lookup in Lambda. | Gives you per‑client routing without changing client code. |
| ⭐️ High | Implement FCM‑backed Android app with bubble support (using `setBubbleMetadata`). | Gives you the exact UI you described – a floating overlay that persists until dismissed. |
| ⚙️ Medium | Document the SNS Message Attribute `priority` (already done) and add it to the client‑setup guide. |
| ⚙️ Medium | Evaluate Matrix if you prefer an open‑source chat‑centric approach. |
| ⚙️ Low | Prototype Push‑to‑Talk using Kinesis Video Streams + FCM. |

---
### How to Proceed
1. **Update the repo** – add the token map to `config/config.json` (or a new `src/pushover-config.ts`).
2. **Deploy the Lambda** – re‑run `make deploy` after the code change.
3. **Create the Android app** – I can scaffold a minimal Kotlin project with the required `FirebaseMessagingService` and bubble logic.
4. **Optional** – spin up a Matrix Synapse instance on AWS if you want a chat‑style backend.

Feel free to let me know which of these paths you’d like to prioritize, and I’ll prepare the corresponding code changes and documentation.
