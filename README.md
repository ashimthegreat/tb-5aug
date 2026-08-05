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
- **Services** — service categories (industries) and the services inside them
- **Products** — the products portfolio
- **Brands / Partners / Careers** — logos, links and copy

Changes are saved to JSON files in `content/` via API routes and appear on the
site immediately.

**Password:** set `ADMIN_PASSWORD` in `.env.local` (default `techbucket-admin`).
The admin password gates `/admin` and all `/api/admin/*` routes.

**Image uploads:** the admin panel uploads images to `public/uploads/`.

> Note: admin edits are written to files on the server at runtime, so the app
> should run on a Node server (`next start`) rather than a fully static export.

## Structure

```
content/       Editable site content (JSON, managed via /admin)
src/
  app/         Pages and routes (/, /services, /products, /admin, /api/…)
  components/  UI components + admin panel editors
  lib/         Data loaders, file store, admin auth helpers
public/images/ Brand and partner logos
```
