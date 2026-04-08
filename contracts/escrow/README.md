# Escrow Contract

Smart contract care gestionează fondurile pentru task-uri async:
- Lock fonduri la submiterea task-ului
- Release automat sau condiționat la completion
- Refund la task eșuat sau expirat
- Dispute window și slash logic

## Endpoints (planned)

| Endpoint | Type | Description |
|---|---|---|
| `createEscrow` | Call + Payment | Blochează fonduri pentru task |
| `releaseEscrow` | Call | Eliberează fonduri după proof hash |
| `refundEscrow` | Call | Returnează fonduri la consumer |
| `raiseDispute` | Call | Deschide dispută |
| `resolveDispute` | Call | Rezolvă disputa (arbitru/DAO) |
