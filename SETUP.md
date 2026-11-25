# LendLoop setup

## Convex

- `npx convex dev`
- `npx convex env set CLERK_JWT_ISSUER_DOMAIN your-clerk-domain`
- `npx convex env set N8N_WEBHOOK_URL https://your-n8n-instance.com/webhook/lendloop-request-notification`
- `npx convex env set HMAC_SECRET some-random-secret`
- Create the Clerk JWT template named `convex` with subject claim `clerkId` (or the default subject) and the issuer set to your Clerk domain.
- Promote an admin: `npx convex admin promote <email>` (internal mutation `users.makeAdmin`).

## n8n

- `docker compose up -d`
- Import the three workflows from `n8n/workflows/` into n8n (Settings -> Import):
  - `lendloop-request-notification.json`
  - `lendloop-overdue-reminders.json`
  - `lendloop-error-handler.json`
- Set the Error Workflow in the settings of the reminder and notification workflows to the Error Handler workflow.
- Point the webhook URL of workflow 1 at your Convex deployment.

## Next.js

- Copy `.env.example` to `.env.local`.
- Fill in `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`.
- `npm run dev`
