# PageSmith AI API

Railway-ready backend for PageSmith: email OTP auth + AI Polish. The Claude key stays off the static site.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/health` | no | Health check |
| `POST` | `/api/auth/request-code` | no | Send 6-digit OTP to allowlisted email |
| `POST` | `/api/auth/verify-code` | no | Exchange email + code for session token |
| `GET` | `/api/auth/me` | Bearer | Current session |
| `POST` | `/api/auth/logout` | Bearer | Revoke session |
| `POST` | `/api/polish` | Bearer | AI document polish |

## Scraper-safe OTP

Email hosts and security bots often **GET** every link in a message, which burns one-time magic links before the user clicks. PageSmith auth avoids that:

- Emails contain a **6-digit code**, not a login token in a URL
- The optional “Open PageSmith” link is only `https://tactag.app/pagesmith/` with **no secrets**
- The user must type the code on the sign-in screen (bots that only follow links cannot complete login)

## Railway Variables

| Variable | Required | Notes |
|----------|----------|--------|
| `ANTHROPIC_API_KEY` | for AI | Claude key |
| `ANTHROPIC_MODEL` | no | default `claude-sonnet-4-6` |
| `ALLOWED_ORIGINS` | yes | `https://tactag.app,http://localhost:3000` |
| `RESEND_API_KEY` | for auth | Resend API key |
| `RESEND_FROM` | no | verified sender, e.g. `PageSmith <noreply@construe.tactag.app>` |
| `SESSION_SECRET` | yes | long random string; sessions break if rotated |
| `AUTH_ALLOWLIST` | no | comma emails; defaults to Tyson + D6 supervisor |
| `APP_URL` | no | plain link in OTP email |

## Deploy

Deploy this folder as the Railway service root:

```sh
pagesmith-api
```

Service URL used by the static app: `https://pagesmith-api-production.up.railway.app`
