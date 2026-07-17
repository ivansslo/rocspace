# UI template review — 2026-07-17

## Result

| File | Role | Review result | Action |
|---|---|---|---|
| `rocspace-command-center.html` | New command-center dashboard | **Approved as production visual base.** It is responsive, self-contained, dependency-free, and oriented around infrastructure operations. | Integrated into the site Worker as `workers/site/src/pages/hub.html`. |
| `rocspace-dashboard.html` | v18 Xloud landing/dashboard | Usable visual reference, but it has stale hard-coded figures (for example model/provider counts) and duplicate landing purpose. | Kept as **legacy reference**; do not deploy as canonical Hub. |
| `orchestrator-live.html` | Agent orchestration concept | Useful workflow mockup, but not connected to authenticated task/agent APIs. | Kept as **prototype**; connect only after API/authorization design exists. |
| `index.html` | Template directory | Previously described all templates as current and linked to a non-existent sibling path. | Updated labels and made the `roc-containers` reference an external repository link. |

## Production integration

`hub.roadfx.biz.id/` now renders `workers/site/src/pages/hub.html` through `renderHub()`.

- `scripts/build-site.mjs` now registers esbuild's `--loader:.html=text`.
- `workers/site/src/globals.d.ts` declares HTML module imports for TypeScript tooling.
- The new Hub keeps links relative to the canonical worker routes.
- “Refresh status” performs browser-side, same-origin probes for `/`, `/v1/models`, and `/health`. The UI reports a real HTTP error/unreachable state rather than claiming a service is healthy.

## Important operational notes

1. The traffic chart and recent-routing table remain **presentation/demo data**. They should be replaced with an authenticated aggregate telemetry endpoint; do not expose detailed internal infrastructure data publicly just to populate a chart.
2. The health cards use a public-safe check only. `/health` already provides a worker-side VM bridge and is appropriate for this view.
3. The site Worker was deployed to `roc-site` on 2026-07-17 after a production-safe binding check. Its existing `GATEWAY_TOKEN` `secret_text` binding was verified intact after deploy.
4. Two pre-existing executable-bit changes (`archive/ai-vitality/hermes-cli.sh` and `tools/antigravity-vm-install.sh`) were not modified as part of UI work.

## Live endpoint check (2026-07-17)

The following public checks returned successfully during review:

| URL | Result | Notes |
|---|---:|---|
| `https://hub.roadfx.biz.id/` | 200 | Current public Hub is reachable. |
| `https://hub.roadfx.biz.id/health` | 200 | VM bridge returned `status: ok`; services include WebVirtCloud, PostgreSQL, Redis, and Uptime Kuma. |
| `https://hub.roadfx.biz.id/v1/models` | 200 | Returned 16 model entries. |
| `https://api.roadfx.biz.id/` | 200 | Canonical API endpoint is reachable. |
| `https://hub.roadfx.biz.id/links` | 200 | Local directory is reachable. |
| `https://hub.roadfx.biz.id/status` | 200 | Local status page is reachable. |

The Command Center deployment was subsequently verified at `https://hub.roadfx.biz.id/`: the returned page title is `RocSpace Command Center — Template`, `/health` returned `status: ok`, `/v1/models` returned 16 models, and both `/links` and `/status` returned 200. Production dependencies have no reported vulnerabilities from `npm audit --package-lock-only --omit=dev` (0 total). A source scan found environment-variable placeholders in archived configuration only; no literal credentials were found by that scan.

## Certveis.space and synchronized navigation review (2026-07-18)

- `certveis.space` is an active Cloudflare zone, but its Workers Routes list is empty. No custom-domain Worker relationship exists that should be migrated to the RoadFX Hub.
- `hermes-cloudflare.certveis.workers.dev` responds successfully as the Workers.dev gateway endpoint; it remains an internal gateway origin and was not attached to `certveis.space`.
- Per the selected action, `certveis.space` was left unchanged: no redirect, DNS, route, or Worker attachment was created.
- The `roc-site` deployment now includes a synchronized local navigation surface for Hub, Directory, Status, Quick Chat, and VM Console. Each includes a **Developer** link to `github.com/ivansslo/rocspace`; VM keeps its native navigation and includes the same local links plus Developer.
- After deploy, the `GATEWAY_TOKEN` `secret_text` binding was queried again and remains present.

## Gateway no-mirror routing (2026-07-18)

The Gateway discovery response now advertises only the canonical public destinations:

- UI pages: `https://hub.roadfx.biz.id/dashboard`, `/chat-live`, `/crew`, `/crawl4ai`, `/zapier`, and `/logs`.
- Hub: `https://hub.roadfx.biz.id`.
- API: `https://api.roadfx.biz.id`.

A direct browser GET/HEAD request to the corresponding `hermes-cloudflare.certveis.workers.dev` UI paths now returns a permanent `301` to the equivalent Hub URL. Requests proxied from the Hub retain `X-Forwarded-Host` and are served by the gateway, preventing a redirect loop. The Workers.dev hostname remains available for machine/API endpoints, while `/api` on the Hub redirects to the canonical API hostname.

## Primary VM monitor (2026-07-18)

`/monitor` no longer redirects a browser to the Oracle VM's raw HTTP address. It now serves a local HTTPS monitoring page from `hub.roadfx.biz.id` with same-origin probes for the Hub, gateway model catalog, status page, and the existing server-side `/health` bridge.

The monitor presents the Oracle VM as the primary server origin without rendering private network addresses or infrastructure credentials. The health bridge verified the Singapore VM and its reported services: WebVirtCloud, PostgreSQL, Redis, Uptime Kuma, and npm. OCI identifiers provided for operational context were not written to source files, deployment metadata, or Git changes.

## Automatically synchronized navigation (2026-07-18)

Navigation is now generated from the shared `HUB_NAV_ITEMS` definition in `packages/shared/src/index.ts`. Hub, Monitor, Directory, Status, Quick Chat, and the VM Console’s native sidebar render from that definition. The Gateway’s Dashboard, Chat Live, Crew, Crawl4AI, Zapier, and Logs pages receive an isolated canonical shell from the same source. Adding a menu item to this list automatically makes it available across these local Hub and proxied Gateway pages; no per-page sidebar copy needs maintenance.

## Workers.dev hostname constraint (2026-07-18)

Cloudflare reports the account Workers.dev subdomain as `certveis`. An attempted account-wide change to `roadfx` was rejected by Cloudflare (`409`, account already has an associated subdomain), and `roadfx.worker.dev` / `sitehub.roadfx.worker.dev` are not valid/resolving hostnames.

## sitehub Worker reconstruction (2026-07-18)

The account was subsequently replaced: its Workers.dev subdomain is now `hubfx`, the active production script is `sitehub`, and all 17 `*.roadfx.biz.id` custom domains are bound to `sitehub`. The old `roc-site` and `hermes-cloudflare` scripts no longer exist in that account.

The site source and deployment mapping now target `sitehub.hubfx.workers.dev`. Dashboard, Chat Live, Crew, Crawl4AI, Zapier, and Logs render locally from the `sitehub` Worker using the same injected canonical navigation shell as the Hub. All tested legacy UI domains return permanent redirects to the corresponding Hub path; `api.roadfx.biz.id` is retained as the machine endpoint and currently serves the API root plus `/v1/models` (16 models). Legacy provider-backed API operations require a dedicated restored gateway/provider Worker before they can be made available again; they now return an explicit service-unavailable response rather than a DNS/origin error.

## Final UI/API canonical split (2026-07-18)

All page requests on legacy `*.roadfx.biz.id` hosts permanently redirect to `hub.roadfx.biz.id`. API-shaped paths (`/v1/`, `/ai/`, `/auth/`, `/webhook/`, `/crawl*`, `/notify*`, `/solace*`, and `/health`) permanently redirect with `308` to `api.roadfx.biz.id`, preserving POST method and body. The Hub applies the same split so UI remains on Hub and machine traffic is centralized on API. `api.roadfx.biz.id/v1/models` and `/health` were verified after deploy.

`monitor.roadfx.biz.id` was present as a Workers custom-domain binding but did not resolve in the public DNS check; it therefore needs its Cloudflare DNS/custom-domain activation corrected before its legacy redirect can be reached. The canonical monitor remains available at `https://hub.roadfx.biz.id/monitor`.
