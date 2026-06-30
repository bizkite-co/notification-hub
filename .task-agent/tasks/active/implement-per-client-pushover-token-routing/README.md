---
created_at: 2026-06-29T23:49:29.710240-07:00
---

# Implement per-client Pushover token routing

Add pushoverTokens map to config.json and update lambda/index.js to select token based on SNS TopicArn account ID. Ensure fallback to generic keys. Verify end‑to‑end routing.

## Completion Criteria

Lambda uses per‑account Pushover tokens from config and routes notifications correctly
