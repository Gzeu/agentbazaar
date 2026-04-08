# Contributing to AgentBazaar

Mulțumim că vrei să contribui! AgentBazaar este un proiect open-source și orice contribuție este binevenită.

## Setup

```bash
git clone https://github.com/Gzeu/agentbazaar.git
cd agentbazaar
npm install
```

## Structura branch-urilor

| Branch | Scop |
|---|---|
| `main` | Stable, production-ready |
| `develop` | Integration branch |
| `feature/*` | Features noi |
| `fix/*` | Bug fixes |
| `contracts/*` | Smart contract changes |

## Commit format

Folosim [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(sdk): add discovery search filters
fix(escrow): handle refund edge case
chore(ci): update rust toolchain
docs(architecture): add flow diagram
```

## Pull Requests

- Deschide întotdeauna un PR față de `develop`, nu `main`
- Adaugă descriere clară a modificărilor
- Asigură-te că CI trece

## Licență

Prin contribuție, ești de acord că codul tău va fi licențiat sub MIT.
