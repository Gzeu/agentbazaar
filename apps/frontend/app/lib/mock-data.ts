/**
 * Mock data removed — all data is fetched live from the backend API.
 *
 * Hooks to use instead:
 *   useServices()              → apps/frontend/app/hooks/useServices.ts
 *   useTasks()                 → apps/frontend/app/hooks/useTasks.ts
 *   useReputationLeaderboard() → apps/frontend/app/hooks/useReputation.ts
 *   useAgentReputation()       → apps/frontend/app/hooks/useReputation.ts
 *   useDispute() / useRefund() → apps/frontend/app/hooks/useDispute.ts
 *
 * For local dev without a backend:
 *   cd apps/backend && npm run start:dev
 *   (ensure NEXT_PUBLIC_API_URL=http://localhost:3001 in apps/frontend/.env.local)
 */

export const MOCK_SERVICES:  never[] = [];
export const MOCK_TASKS:     never[] = [];
export const MOCK_PROVIDERS: never[] = [];
