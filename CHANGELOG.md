# Changelog

All notable changes to AgentBazaar are documented here.

---

## [Unreleased]

### Added
- Unit tests for `TasksService` (complete / dispute / refund / findAll / create)
- `DisputeModal` component — open dispute with reason textarea + on-chain note
- `TaskCard` action buttons: Dispute (orange) + Refund (purple, confirm flow)
- `TasksList` refresh button + optimistic local overrides after dispute/refund

---

## 2026-07-07 — Batch 3: AppModule wiring + strict TS + controller fixes

### Fixed
- `app.module.ts` — `TasksService.setDependencies()` now called via `ModuleRef` in `onModuleInit()` so `updateFromTask` + `incrementTaskStats` are actually wired at runtime
- `tsconfig.json` — strict mode enabled: `strictNullChecks`, `noImplicitAny`, `noEmitOnError`, `strictBindCallApply`, `forceConsistentCasingInFileNames`
- `reputation.controller.ts` — `GET /api/v1/reputation` root route was missing (404); leaderboard now accessible by frontend
- `services.controller.ts` — `POST /api/v1/services` body typed as `CreateServiceDto`; `DELETE /api/v1/services/:id` added; `?active=true` query param now forwarded correctly
- `services.service.ts` — `activeOnly` filter logic fixed; `deregister()` added; failed task penalises `reputationScore` −5%

---

## 2026-07-06 — Batch 2: Frontend API migration + new hooks

### Added
- `useReputation.ts` — `useReputationLeaderboard` + `useAgentReputation` hooks with polling
- `useDispute.ts` — `useDispute()` + `useRefund()` hooks with state machine (idle → loading → success/error)

### Changed
- `useTasks.ts` — replaced `MOCK_TASKS` with real `tasksApi.list()` + 15s polling + cursor pagination + `refresh()`
- `useServices.ts` — replaced `MOCK_SERVICES` with real `servicesApi.list()` + 30s polling
- `lib/api.ts` — all endpoint paths corrected; typed generics; global error interceptor; `dispute`, `refund`, `list` endpoints added
- `lib/types.ts` — `ServiceCategory` slugs fixed (`data`, `compute`); `TaskStatus` + `refunded`; `disputeReason`, `DisputeVote`, `Provider` interfaces
- `lib/mock-data.ts` — emptied with migration comment

### Fixed
- `tasks.service.ts` — `reputationService.updateFromTask` + `servicesService.incrementTaskStats` wired in `complete()`, `refund()`, `simulateExecution()`
- `tasks.module.ts` — now imports `ReputationModule` + `ServicesModule`

---

## 2026-07-05 — Batch 1: Validation DTOs + service/task/reputation upgrades

### Added
- `tasks/dto/create-task.dto.ts` — class-validator decorators
- `tasks/dto/complete-task.dto.ts` — `@IsString` on `proofHash`, `@IsNumber @Min(0)` on `latencyMs`
- `services/dto/create-service.dto.ts` — enum category, `@Min`/`@Max` on `uptimeGuarantee`, `@IsArray` on `tags`
- `TASK_TIMEOUT_MS = 1800 * 1000` constant aligned with Escrow contract
- `dispute(id, reason)` endpoint — `POST /tasks/:id/dispute`
- `refund(id)` endpoint — `POST /tasks/:id/refund` with deadline check
- Cursor pagination on `findAll` — `nextCursor` in response
- `TaskStatus` — `refunded` added
- `incrementTaskStats(serviceId, success, latencyMs)` — EMA reputation update
- `ReputationService.updateFromTask()` + `syncedAt` timestamp
- `.env.example` — `TREASURY_ADDRESS`, `ARBITER_*`, `CORS_ORIGINS` documented

---

## 2026-07-04 — Initial scaffold

### Added
- NestJS backend with `ServicesModule`, `TasksModule`, `ReputationModule`, `MultiversxModule`, `DiscoveryModule`, `HealthModule`, `EventsModule`
- Next.js 14 frontend with Tailwind + `shadcn/ui`
- MultiversX Rust smart contracts: `escrow`, `reputation`, `governance`
- In-memory stores for services, tasks, reputation (no DB dependency for MVP)
- Swagger UI at `/api/docs`
