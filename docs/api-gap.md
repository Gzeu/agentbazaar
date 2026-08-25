# API Coverage — Backend endpoints vs Marketplace frontend

Audit 2026-08-25 (v1.0.0).

## Backend endpoints (NestJS, prefix /api/v1)

| Module | Endpoints |
|---|---|
| tasks | GET / · GET :id · POST / · POST :id/complete · POST :id/dispute · POST :id/refund |
| services | GET / · GET :id · POST / · DELETE :id |
| reputation | GET / (leaderboard) · GET :address |
| discovery | GET / (UCP query) |
| events | GET / (recent) + WebSocket /events |
| analytics | GET / (overview) · GET /categories · GET /volume |
| health | GET / |

## Frontend usage (apps/marketplace)

| Hook/Page | Consumă | Status |
|---|---|---|
| useAgentBazaar (catalog) | GET /services via SDK `ucp.getAllServices()` | ✅ conectat |
| useServiceDetail | GET /services/:id via SDK | ✅ conectat |
| useEvents | GET /events + polling EventsClient | ✅ conectat |
| useBuyTask | POST /tasks (+ escrow TX best-effort) | ✅ conectat |
| WalletContext | sdk-dapp deep imports → **degraded mode** (webpackIgnore fallback) | ⚠️ wallet UI non-funcțional până la migrarea pe sdk-dapp v5 sau direct @multiversx/sdk-core signing |

## Goluri identificate (TODO)

1. **Marketplace nu expune UI pentru**: POST /tasks/:id/complete · :id/dispute · :id/refund (existau în vechiul temp-frontend — DisputeModal etc. n-au fost migrate)
2. **Analytics** (overview/categories/volume) — fără pagină/hook dedicat în marketplace (era useAnalytics în temp-frontend)
3. **Provider registration** (POST /services) — lipsește formularul din marketplace (exista /services/register în legacy)
4. **DELETE /services/:id** — nefolosit nicăieri
5. **Wallet signing real** — blocat de sdk-dapp broken; recomandare: migrare pe `@multiversx/sdk-core` Session/`sdk-dapp` v5 API oficial
6. **Auth/JWT** — backend are AuthModule dar frontend-ul nu trimite token
