# API Coverage — Backend endpoints vs Marketplace frontend

Audit 2026-08-25 · actualizat post-PR #5/#6/#7.

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

## Frontend coverage (apps/marketplace)

| Page | Ruta | Consumă | Status |
|---|---|---|---|
| Home / Landing | `/` | — | ✅ |
| Marketplace catalog | `/marketplace` | useAgentBazaar (SDK ucp.getAllServices) | ✅ |
| Service detail | `/marketplace/[id]` | useServiceDetail | ✅ |
| Consumer (tasks + actions) | `/consumer` | useMyTasks + useTaskActions (dispute/refund/complete) | ✅ |
| Provider dashboard | `/provider` | useProviderDashboard (services/tasks/reputation) | ✅ |
| Register service | `/register` | servicesApi.register (CreateServiceDto) | ✅ |
| Analytics | `/analytics` | useAnalytics (dashboard/categories/volume) | ✅ |
| Leaderboard | `/leaderboard` | reputationApi.leaderboard | ✅ |
| Live events feed | `/events` | useEvents (SDK EventsClient polling) | ✅ |
| Wallet | — | WalletContext | ⚠️ degraded (sdk-dapp broken) |

## Goluri rămase (open)

1. **Wallet signing real** — sdk-dapp deep-imports nu există în v2.40; opțiuni: migrare @multiversx/sdk-core signing + WalletConnectV2Provider direct (parțial în ConnectModal) sau sdk-dapp v5
2. **Auth/JWT** — backend are AuthModule dar frontend nu trimite token; gate pe acțiuni admin/provider declare
3. **DELETE /services/:id** — nicio UI (deregister) pentru servicii
4. **Env vars Vercel/WalletConnect** — config din dashboard (Root Directory confirmat, WalletConnect ID lipsă)

## Rezolvat (din auditul anterior)

- ~~dispute/refund/complete UI~~ → PR #5
- ~~analytics~~ → PR #6
- ~~provider registration~~ → PR #6
- ~~leaderboard + provider mock~~ → PR #7
