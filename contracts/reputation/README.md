# Reputation Contract

Smart contract pentru scor de reputație compozit:
- Succes/eșec task-uri
- Rata de dispute
- Latență mediană
- Stake score
- Decay temporal (favorizează performanța recentă)

## Scor Compozit

```
Reputation Score = 
  (completion_rate × 0.40) +
  (stake_score     × 0.25) +
  (latency_score   × 0.20) +
  (dispute_rate    × -0.15)

Cu decay: score_n = score_n-1 × 0.95 + new_event_weight × 0.05
```

## Endpoints (planned)

| Endpoint | Type | Description |
|---|---|---|
| `recordOutcome` | Call | Înregistrează rezultat task |
| `getScore` | View | Returnează scorul compozit |
| `getHistory` | View | Returnează istoricul de performanță |
| `slashAgent` | Call | Penalizare pentru comportament fraudulos |
