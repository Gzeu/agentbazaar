# AgentBazaar Frontend — Deploy pe Vercel

## 1. One-time setup

### Install Vercel CLI (dacă nu ai)
```bash
npm i -g vercel
vercel login
```

---

## 2. Link repo la Vercel

```bash
cd apps/frontend/temp-frontend
vercel link
```

Sau din dashboard: **[vercel.com/new](https://vercel.com/new)** → Import Git Repository → `Gzeu/agentbazaar`

> ⚠️ **Root Directory**: setează `apps/frontend/temp-frontend` în Vercel settings

---

## 3. Environment Variables în Vercel Dashboard

Mergi la: **Project → Settings → Environment Variables**

Adaugă toate variabilele din `.env.local.example`:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | URL-ul backend-ului tău deploiat (ex: Railway/Render) |
| `NEXT_PUBLIC_MVX_NETWORK` | `devnet` |
| `NEXT_PUBLIC_MVX_API` | `https://devnet-api.multiversx.com` |
| `NEXT_PUBLIC_MVX_EXPLORER` | `https://devnet-explorer.multiversx.com` |
| `NEXT_PUBLIC_REGISTRY_CONTRACT` | adresa din `devnet/deploy.sh` output |
| `NEXT_PUBLIC_ESCROW_CONTRACT` | adresa din `devnet/deploy.sh` output |
| `NEXT_PUBLIC_REPUTATION_CONTRACT` | adresa din `devnet/deploy.sh` output |
| `NEXT_PUBLIC_TOKEN_CONTRACT` | adresa din `devnet/deploy.sh` output |
| `NEXT_PUBLIC_DAO_CONTRACT` | adresa din `devnet/deploy.sh` output |
| `NEXT_PUBLIC_BAZAAR_TOKEN_ID` | token identifier după deploy |
| `NEXT_PUBLIC_WC_PROJECT_ID` | de la [cloud.walletconnect.com](https://cloud.walletconnect.com) |

---

## 4. Deploy

### Automat (recomandat)
Orice push pe `main` → Vercel redeploy automat dacă ai GitHub integration activat.

### Manual CLI
```bash
cd apps/frontend/temp-frontend

# Preview deploy
vercel

# Production deploy
vercel --prod
```

---

## 5. Vercel Project Settings obligatorii

| Setting | Value |
|---|---|
| **Framework Preset** | Next.js |
| **Root Directory** | `apps/frontend/temp-frontend` |
| **Build Command** | `npm run build` |
| **Install Command** | `npm install` |
| **Output Directory** | `.next` |
| **Node.js Version** | 20.x |

---

## 6. Fix pentru monorepo (dacă Vercel nu detectează root)

În **Project Settings → Git → Ignored Build Step**, lasă gol.

Alternativ, dacă folosești Turborepo sau pnpm workspaces și Vercel ignoră subdirectorul:

```bash
# Setează root directory direct la linking:
vercel link --cwd apps/frontend/temp-frontend
vercel --prod --cwd apps/frontend/temp-frontend
```

---

## 7. Polyfills necesare (deja configurate în next.config.ts)

`@multiversx/sdk-core` folosește module Node.js în browser.
Next.config are webpack fallbacks pentru: `fs`, `net`, `tls`, `crypto`, `stream`, `buffer`.

Dacă build-ul dă erori despre aceste module:
```bash
npm install crypto-browserify stream-browserify buffer
```

---

## 8. Post-deploy checklist

- [ ] Accesează URL-ul Vercel și verifică că `/` se încarcă
- [ ] Conectează xPortal wallet din navbar
- [ ] Verifică `/status` — backend și contracts trebuie să fie `online`
- [ ] Submit un task de test din marketplace
- [ ] Verifică `/analytics` — metrici live

---

## Troubleshooting comun

**Build fail: `crypto` not found**
```bash
npm install crypto-browserify stream-browserify buffer
```

**CORS errors la backend**
Adaugă în backend `.env`:
```
CORS_ORIGIN=https://your-app.vercel.app
```

**Wallet connect nu funcționează**
Verifică `NEXT_PUBLIC_WC_PROJECT_ID` — trebuie să fie completat cu un ID real de la [cloud.walletconnect.com](https://cloud.walletconnect.com).

**`NEXT_PUBLIC_*` variabile undefined în producție**
Toate variabilele `NEXT_PUBLIC_` trebuie adăugate în **Vercel Dashboard → Settings → Environment Variables**, nu doar în `.env.local`.
