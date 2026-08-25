# Legacy / Deprecated components

## apps/frontend (Next.js 14) + apps/frontend/temp-frontend

Status: **legacy** — supersedat de `apps/marketplace` (Next.js 15, React 19).

- CI nu le mai compilează (vezi .github/workflows/ci.yml — jobul Frontend pointează spre apps/marketplace)
- Vercel deploy-ul e configurat să construiască apps/marketplace (vezi vercel.json din root)
- Nu se mai adaugă funcționalitate nouă aici; migrarea restului de pagini în marketplace rămâne TODO

Ultima actualizare: 2026-08-25
