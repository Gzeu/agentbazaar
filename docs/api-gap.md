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
2. **Env vars Vercel/WalletConnect** — config din dashboard (Root Directory confirmat, WalletConnect ID lipsă)

> Notă: `sdk-wallet-connect-provider` are un fallback funcțional în `ConnectModal` (deschide xPortal cu WC URI) pentru demo dev, deci conectarea funcționează. Wallet signing real (message signing pentru proof) rămâne blocat până la migrare sdk.

## Rezolvat (din auditul anterior)

### PR #9 — Deregister service (DELETE /services/:id)
- `servicesApi.deregister` în client
- Buton Deregister pe Provider Dashboard (confirmare + refresh)
- Backend service trecut la `active=false`

### PR #10 — JWT auth flow
- Backend: POST /auth/login (public) returnează 7d JWT; global JwtAuthGuard protejează toate rute API; /health public
- Frontend: `useAuth` (login/logout/token), `WalletContext` emite automat JWT la conectare wallet, `Authorization: Bearer` header în api.ts
- Test: vitest 7/7, tsc clean, backend smoke verificat (login→token, /health 200, /services 401/200)

- ~~dispute/refund/complete UI~~ → PR #5
- ~~analytics~~ → PR #6
- ~~provider registration~~ → PR #6
- ~~leaderboard + provider mock~~ → PR #7
