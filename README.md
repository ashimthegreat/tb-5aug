# TechBucket Website

Rebuild of the [TechBucket](https://techbucket.com.np) website — a Nepal-based
software and IT company. Built with **Next.js (App Router)**, **TypeScript** and
**Tailwind CSS v4**.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command          | Description                    |
| ---------------- | ------------------------------ |
| `npm run dev`    | Start the development server   |
| `npm run build`  | Create a production build      |
| `npm run start`  | Serve the production build     |
| `npm run lint`   | Run ESLint                     |

## Pages

- `/` — Home (hero, about, services, products, vision, contact)
- `/services` — services organised by industry/category
- `/products` — products we build (e.g. Infrastructure)
- `/brands` — technology partners (Oracle Health, Aruba, Dell, …)
- `/partners` — partner organisations
- `/careers` — perks and open positions
- `/admin` — content management panel

## Admin panel

Everything on the site is editable from **`/admin`**:

- **Content** — hero, about, stats, mission/vision, values, contact details
- **Home** — homepage sections (hero, solutions, services, stats, CTA)
- **Services** — service categories (industries) and the services inside them
- **Products / Categories / Brands / Partners / Careers** — the portfolios
- **Customers / Orders / Fulfillment / Ledger / Reports / Sent Log / Discounts / Bank Accounts / Users / My Profile** — sales, billing and fulfilment workflow

Changes are saved to JSON files in `content/` via API routes and appear on the
site immediately.

**Authentication:** `/admin` uses multi-user logins (credentials stored in
`content/users.json`). Roles: `superadmin`, `content`, `sales`, `saleshead`,
`support`, `logistics`. Sessions are an httpOnly `tb_admin` cookie signed with
`ADMIN_SECRET`.

**Required environment variables in production:**

| Variable | Purpose |
| -------- | ------- |
| `ADMIN_SECRET` | Signs admin sessions (REQUIRED — the app refuses to boot without it in production) and encrypts per-admin SMTP passwords |
| `CRON_SECRET` | Protects `/api/admin/overdue/auto` (Bearer token) for the daily overdue cron |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Sends public order/quote/support notifications |
| `SUPPORT_TO` / `QUOTES_TO` | Fallback recipients for tickets and order/quote requests |

See `.env.example` for a full template.

**Image uploads:** the admin panel uploads images to `public/uploads/`.

### Deployment notes (cPanel, persistent Node server)

> Admin edits are written to files on the server at runtime, so the app must run
> on a persistent Node server (`next start`) — it cannot be a static export.

1. **Node ≥ 20.9** is required (Next.js 16 requirement).
2. Run a production build on the server: `npm ci && npm run build`
   (requires a fresh `node_modules`; build artifacts are not committed).
3. Entry point for the cPanel Node.js App Manager: `server.js` (starts
   `next start` in-process). Then serve `npm run start` / `server.js` with
   `NODE_ENV=production`.
4. `content/` must be writable by the Node process. Copy the committed seed
   files (`home.json`, `industries.json`, `bank-accounts.json` and the tracked
   catalogue files) into `content/`. PII state
   (`users.json`, `customers.json`, `orders.json`, `fulfillment.json`,
   `tickets.json`, `sent-log.json`) is gitignored — it starts empty and is
   managed through the admin panel.
5. Set `ADMIN_SECRET`, `CRON_SECRET` and the SMTP variables in the cPanel
   environment or `.env.production`.
6. Schedule a daily cron job that curls the overdue reminder:
   `curl -H "Authorization: Bearer $CRON_SECRET" https://yourdomain.com/api/admin/overdue/auto`.
7. Serve over HTTPS so the admin session cookie's `secure` flag works.

## Structure

```
content/       Editable site content (JSON, managed via /admin)
src/
  app/         Pages and routes (/, /services, /products, /admin, /api/…)
  components/  UI components + admin panel editors
  lib/         Data loaders, file store, admin auth helpers
public/images/ Brand and partner logos
```
