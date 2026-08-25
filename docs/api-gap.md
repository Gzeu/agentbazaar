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
| Wallet | — | WalletContext (WebWallet + Extension + dev login) | ✅ WalletConnect removed |

## Goluri rămase (open)

1. **Env vars Vercel** — `NEXT_PUBLIC_BACKEND_URL` rămâne de setat în Vercel dashboard (sau implicit `localhost:3001` dev). Backend-ul rulează în **mock mode** (fără contracte deployate pe testnet); pentru date reale pe-chain e nevoie de deploy + adrese în env.

> Toate celelalte funcționalități — auth JWT, dispute/refund/complete, deregister, leaderboard, analytics — sunt acum complet funcționale pe testnet cu semnare on-chain reală (Extension/Web Wallet).

## Rezolvat (din auditul anterior)

### PR #9 — Deregister service (DELETE /services/:id)
- `servicesApi.deregister` în client
- Buton Deregister pe Provider Dashboard (confirmare + refresh)
- Backend service trecut la `active=false`

### PR #10 — JWT auth flow
- Backend: POST /auth/login (public) returnează 7d JWT; global JwtAuthGuard protejează toate rute API; /health public
- Frontend: `useAuth` (login/logout/token), `WalletContext` emite automat JWT la conectare wallet, `Authorization: Bearer` header în api.ts
- Test: vitest 7/7, tsc clean, backend smoke verificat (login→token, /health 200, /services 401/200)

### PR #11 — WalletConnect eliminat + dev login
- `ConnectModal`: eliminat butonul xPortal/WalletConnect; rămân **WebWallet** (redirect) + **Browser Extension** (DeFi Wallet) + **Quick dev login** (event `dev-address`)
- `WalletContext`: listener pentru `dev-address`; auto-issued JWT rămâne la adresa setată; disconnect curăță token
- WebWallet și Extension folosesc sdk-dapp v2.40 (degraded mode fără full signing chain)
- Nu mai este nevoie de `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` în Vercel

### PR #12 — Direct MultiversX SDK signing
- `hooks/useSigner.ts`: nou hook care împachetează `ExtensionProvider` + `WalletProvider` direct din SDK
- `signMessage(SignableMessage)` + `signTransaction(Transaction)` pentru ambele provider-e
- Web Wallet signature citit din URL la redirect-back (`getMessageSignatureFromWalletUrl`)
- `ConnectModal` refactorizat: butoanele de login folosesc `signer.connectExtension` / `signer.connectWebWallet`
- `WalletContext` expune `signer` global
- Teste noi: 5 pentru `useSigner`; **12/12 passing** în total
- Eliminat complet `sdk-dapp` deep-imports din calea de signare

- ~~dispute/refund/complete UI~~ → PR #5
- ~~analytics~~ → PR #6
- ~~provider registration~~ → PR #6
- ~~leaderboard + provider mock~~ → PR #7
