# TechBucket Website

Rebuild of the [TechBucket](https://techbucket.com.np) website — a Nepal-based
healthcare IT company. Built with **Next.js (App Router)**, **TypeScript** and
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

## Structure

```
src/
  app/          Pages and routes (/, /brands, /partners, /careers)
  components/   Reusable UI components (Navbar, Footer, ContactForm, cards…)
  lib/data.ts   Single source of truth for all site content
public/images/  Brand and partner logos
```

## Content

All content (services, brands, partners, stats, contact info) lives in
`src/lib/data.ts` — update that file to change what's rendered anywhere on the
site.

The contact form uses a `mailto:` fallback: it validates client-side, then opens
the visitor's email client with the message addressed to `info@techbucket.com.np`.
