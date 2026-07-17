# RocSpace UI template decision

**Selected direction: bespoke static Command Center** (`rocspace-command-center.html`)

## Why it fits RocSpace

RocSpace is deployed primarily as Cloudflare Workers and currently renders much of its UI as inline/static HTML. The best template should therefore be:

- **framework-free** — no React/Next runtime or new application server;
- **self-contained** — its preview works without CDN assets and is safe to serve from a Worker;
- **operations-first** — highlights service health, provider routing, quota/billing attention, infrastructure events, and fast links;
- **dark and compact** — suitable for an AI/infrastructure command center rather than a generic ecommerce admin panel;
- **responsive and accessible enough** for desktop operations and quick mobile checks.

The new template provides all of these and contains no copied third-party source code. It is a clean integration starting point rather than a visual-only mockup: navigation, responsive drawer, command palette (`Ctrl/Cmd + K`), refresh feedback, time display, and status-oriented components already work without dependencies.

## Candidates reviewed

| Candidate | Strength | Why it was not selected as the base |
|---|---|---|
| [Tabler](https://github.com/tabler/tabler) | Mature, responsive HTML dashboard UI kit; Bootstrap ecosystem | Requires shipping/adapting Bootstrap and its asset bundle for a small Worker-rendered control surface. |
| [Flowbite Admin Dashboard](https://github.com/themesberg/flowbite-admin-dashboard) | Modern Tailwind dashboard with a free/open source base | Introduces Tailwind build tooling plus Flowbite/JS dependencies; less aligned with the current zero-framework pages. |
| [Next shadcn dashboard starter](https://github.com/Kiranism/next-shadcn-dashboard-starter) | Excellent reference for sophisticated SaaS product UI and Clerk patterns | It requires a Next/React application runtime. RocSpace does not currently use one in this repository. |
| **RocSpace Command Center** | Native fit: static HTML, no network assets, lightweight, focused on AI infrastructure | Chosen. The component/layout approach can later be ported to React or a design system if the repo adopts a frontend app. |

## Adoption

1. Preview `ui-templates/rocspace-command-center.html` directly.
2. Replace demo figures with Worker/API-backed values.
3. Move the markup/styles into `renderHub()` in `workers/site/src/index.ts`, or serve this file through the site Worker.
4. Connect “Refresh status” to a safe health-summary endpoint rather than exposing internal service information directly.

> License note: This file is original project code. The candidates above are cited for evaluation only; none of their source or visual assets were copied.
