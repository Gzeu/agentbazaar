/**
 * Warp Builder SDK for AgentBazaar
 * Builds Warps v3.0.0 compliant JSON for all critical contract actions.
 * https://github.com/JoAiHQ/warps-specs
 */

export const AGENTBAZAAR_CONTRACTS = {
  registry: process.env.NEXT_PUBLIC_REGISTRY_CONTRACT ?? 'erd1qqqqqqqqqqqqqpgq0000000000000000000000000000000registry',
  escrow:   process.env.NEXT_PUBLIC_ESCROW_CONTRACT   ?? 'erd1qqqqqqqqqqqqqpgq0000000000000000000000000000000escrow',
  token:    process.env.NEXT_PUBLIC_TOKEN_CONTRACT    ?? 'erd1qqqqqqqqqqqqqpgq0000000000000000000000000000000token',
  dao:      process.env.NEXT_PUBLIC_DAO_CONTRACT      ?? 'erd1qqqqqqqqqqqqqpgq0000000000000000000000000000000dao',
} as const;

export const WARP_PROTOCOL = 'warp:3.0';
export const WARP_CHAIN = 'multiversx';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://agentbazaar.vercel.app';
const MCP_URL  = process.env.NEXT_PUBLIC_MCP_URL  ?? 'https://api.agentbazaar.xyz/mcp';

// ---------------------------------------------------------------------------
// Type helpers (subset of Warp v3.0.0 schema)
// ---------------------------------------------------------------------------
type WarpText = string | Record<string, string>;

interface WarpActionInput {
  name: string;
  type: string;
  source: 'field' | 'query' | 'user:wallet' | 'hidden';
  label?: WarpText;
  description?: WarpText | null;
  required?: boolean;
  default?: string | number | boolean;
  options?: string[] | Record<string, WarpText>;
  position?: string | object;
  modifier?: string;
  min?: number | string;
  max?: number | string;
  pattern?: string;
}

interface WarpNextEntry {
  identifier: string;
  when?: string;
}

type WarpNextConfig =
  | string
  | WarpNextEntry
  | { success?: string | WarpNextEntry | (string | WarpNextEntry)[]; error?: string | WarpNextEntry | (string | WarpNextEntry)[] };

interface WarpContractAction {
  type: 'contract';
  label: WarpText;
  description?: WarpText | null;
  address?: string;
  func?: string | null;
  args?: string[];
  gasLimit: number;
  value?: string;
  transfers?: string[];
  inputs?: WarpActionInput[];
  next?: WarpNextConfig;
  auto?: boolean;
  primary?: boolean;
  when?: string;
}

interface WarpMcpAction {
  type: 'mcp';
  label: WarpText;
  description?: WarpText | null;
  destination?: { url: string; tool: string; headers?: Record<string, string> };
  inputs?: WarpActionInput[];
  next?: WarpNextConfig;
  auto?: boolean;
  primary?: boolean;
}

interface WarpPromptAction {
  type: 'prompt';
  label: WarpText;
  prompt: string;
  description?: WarpText | null;
  expect?: object | string;
  as?: string;
  inputs?: WarpActionInput[];
  next?: WarpNextConfig;
  auto?: boolean;
  primary?: boolean;
}

type WarpAction = WarpContractAction | WarpMcpAction | WarpPromptAction;

interface Warp {
  protocol: string;
  name: string;
  title: WarpText;
  description: WarpText | null;
  chain: string;
  actions: WarpAction[];
  vars?: Record<string, string>;
  preview?: string;
  related?: string[];
}

// ---------------------------------------------------------------------------
// Phase 1 — Warp Builders
// ---------------------------------------------------------------------------

/**
 * Warp for registerService on the Registry contract.
 * Allows any provider to register a new AI service directly from a shared link.
 */
export function buildRegisterServiceWarp(): Warp {
  return {
    protocol: WARP_PROTOCOL,
    name: 'register-service',
    title: 'Register AI Service',
    description: 'Register a new AI agent service on AgentBazaar marketplace.',
    chain: WARP_CHAIN,
    preview: `${BASE_URL}/og/register-service.png`,
    actions: [
      {
        type: 'contract',
        label: 'Register Service',
        description: 'Calls registerService on the AgentBazaar Registry contract.',
        address: AGENTBAZAAR_CONTRACTS.registry,
        func: 'registerService',
        gasLimit: 10_000_000,
        primary: true,
        inputs: [
          {
            name: 'name',
            type: 'string',
            source: 'field',
            label: 'Service Name',
            required: true,
            position: 'arg:1',
          },
          {
            name: 'description',
            type: 'string',
            source: 'field',
            label: 'Description',
            required: true,
            position: 'arg:2',
          },
          {
            name: 'category',
            type: 'string',
            source: 'field',
            label: 'Category',
            required: true,
            position: 'arg:3',
            options: ['compute', 'orchestration', 'data', 'inference', 'utility'],
          },
          {
            name: 'price',
            type: 'biguint',
            source: 'field',
            label: 'Price (EGLD)',
            description: 'Price per task in EGLD (e.g. 0.1)',
            required: true,
            position: 'arg:4',
            min: 0,
            modifier: 'scale:18',
          },
          {
            name: 'endpoint',
            type: 'string',
            source: 'field',
            label: 'Service Endpoint URL',
            description: 'HTTPS endpoint where the agent accepts tasks',
            required: true,
            position: 'arg:5',
            pattern: '^https://.+',
          },
        ],
        next: {
          success: `${BASE_URL}/marketplace?registered=true`,
          error:   `${BASE_URL}/marketplace?error=register_failed`,
        },
      } satisfies WarpContractAction,
    ],
  };
}

/**
 * Warp for createTask on the Escrow contract.
 * @param serviceId  On-chain service identifier
 * @param providerAddress  Pre-filled provider wallet address
 */
export function buildCreateTaskWarp(serviceId: string, providerAddress?: string): Warp {
  return {
    protocol: WARP_PROTOCOL,
    name: `create-task-${serviceId}`,
    title: 'Create Task',
    description: 'Create and fund a task for an AI service on AgentBazaar.',
    chain: WARP_CHAIN,
    vars: { serviceId },
    actions: [
      {
        type: 'contract',
        label: 'Create Task',
        address: AGENTBAZAAR_CONTRACTS.escrow,
        func: 'createTask',
        gasLimit: 15_000_000,
        primary: true,
        inputs: [
          {
            name: 'service_id',
            type: 'string',
            source: 'hidden',
            label: 'Service ID',
            default: serviceId,
            position: 'arg:1',
          },
          {
            name: 'provider_address',
            type: 'address',
            source: providerAddress ? 'hidden' : 'field',
            label: 'Provider Address',
            default: providerAddress,
            position: 'arg:2',
          },
          {
            name: 'task_description',
            type: 'string',
            source: 'field',
            label: 'Task Description',
            required: true,
            position: 'arg:3',
          },
          {
            name: 'value',
            type: 'biguint',
            source: 'field',
            label: 'Payment (EGLD)',
            required: true,
            position: 'value',
            modifier: 'scale:18',
            min: 0,
          },
        ],
        next: {
          success: `${BASE_URL}/tasks?created=true`,
          error:   `${BASE_URL}/tasks?error=create_failed`,
        },
      } satisfies WarpContractAction,
    ],
  };
}

/**
 * Warp for stakeForDiscount on the Token contract.
 * Presents Bronze/Silver/Gold tiers as selectable options.
 */
export function buildStakeWarp(): Warp {
  return {
    protocol: WARP_PROTOCOL,
    name: 'stake-for-discount',
    title: 'Stake for Discount',
    description: 'Stake ABZ tokens to unlock fee discounts on AgentBazaar.',
    chain: WARP_CHAIN,
    actions: [
      {
        type: 'contract',
        label: 'Stake Tokens',
        address: AGENTBAZAAR_CONTRACTS.token,
        func: 'stakeForDiscount',
        gasLimit: 8_000_000,
        primary: true,
        inputs: [
          {
            name: 'tier',
            type: 'string',
            source: 'field',
            label: 'Staking Tier',
            required: true,
            position: 'arg:1',
            options: {
              bronze: 'Bronze — 100 ABZ (5% discount)',
              silver: 'Silver — 500 ABZ (15% discount)',
              gold:   'Gold   — 2000 ABZ (30% discount)',
            },
          },
        ],
        next: {
          success: `${BASE_URL}/profile?staked=true`,
          error:   `${BASE_URL}/profile?error=stake_failed`,
        },
      } satisfies WarpContractAction,
    ],
  };
}

/**
 * Warp for voting on a DAO proposal.
 * @param proposalId  On-chain proposal ID
 */
export function buildVoteWarp(proposalId: string): Warp {
  return {
    protocol: WARP_PROTOCOL,
    name: `vote-${proposalId}`,
    title: 'Vote on Proposal',
    description: `Cast your vote on AgentBazaar DAO proposal #${proposalId}.`,
    chain: WARP_CHAIN,
    vars: { proposalId },
    actions: [
      {
        type: 'contract',
        label: 'Cast Vote',
        address: AGENTBAZAAR_CONTRACTS.dao,
        func: 'vote',
        gasLimit: 5_000_000,
        primary: true,
        inputs: [
          {
            name: 'proposal_id',
            type: 'string',
            source: 'hidden',
            default: proposalId,
            label: 'Proposal ID',
            position: 'arg:1',
          },
          {
            name: 'vote',
            type: 'bool',
            source: 'field',
            label: 'Your Vote',
            required: true,
            position: 'arg:2',
            options: { true: 'Yes — Support', false: 'No — Reject' },
          },
        ],
        next: {
          success: `${BASE_URL}/dao?voted=true`,
          error:   `${BASE_URL}/dao?error=vote_failed`,
        },
      } satisfies WarpContractAction,
    ],
  };
}

// ---------------------------------------------------------------------------
// Phase 4 — MCP Warp (agent-to-agent)
// ---------------------------------------------------------------------------

/**
 * Warp of type `mcp` for AI agents that support MCP protocol.
 * Allows Claude, LangChain, etc. to call AgentBazaar directly.
 */
export function buildMcpCreateTaskWarp(serviceId: string): Warp {
  return {
    protocol: WARP_PROTOCOL,
    name: `mcp-create-task-${serviceId}`,
    title: 'Execute via AgentBazaar MCP',
    description: 'Programmatic task creation for MCP-compatible AI agents.',
    chain: WARP_CHAIN,
    vars: { serviceId },
    actions: [
      {
        type: 'mcp',
        label: 'Execute via AgentBazaar MCP',
        primary: true,
        destination: {
          url: MCP_URL,
          tool: 'create_task',
          headers: { Authorization: 'Bearer {{vars.token}}' },
        },
        inputs: [
          {
            name: 'service_id',
            type: 'string',
            source: 'hidden',
            default: serviceId,
            label: 'Service ID',
          },
          {
            name: 'task_description',
            type: 'string',
            source: 'field',
            label: 'Task Description',
            required: true,
          },
          {
            name: 'token',
            type: 'string',
            source: 'query',
            label: 'Bearer Token',
          },
        ],
      } satisfies WarpMcpAction,
    ],
  };
}

// ---------------------------------------------------------------------------
// Phase 5 — Prompt Warp (AI-powered discovery)
// ---------------------------------------------------------------------------

/**
 * Warp of type `prompt` — user describes task in natural language,
 * LLM picks the best service, then chains to createTask Warp.
 */
export function buildDiscoveryPromptWarp(): Warp {
  return {
    protocol: WARP_PROTOCOL,
    name: 'discover-and-create',
    title: 'Find Best Service',
    description: 'Describe what you need — AI will find the best service and create a task for you.',
    chain: WARP_CHAIN,
    actions: [
      {
        type: 'prompt',
        label: 'Find best service',
        primary: true,
        prompt:
          'Given these AgentBazaar services: {{vars.services}}, recommend the single best one for the following task: {{input.task_description}}. ' +
          'Respond ONLY with valid JSON matching the expected schema.',
        as: 'RECOMMENDED_SERVICE',
        expect: {
          type: 'object',
          properties: {
            service_id:  { type: 'string' },
            provider:    { type: 'string' },
            reason:      { type: 'string' },
          },
          required: ['service_id'],
        },
        inputs: [
          {
            name: 'task_description',
            type: 'string',
            source: 'field',
            label: 'What do you need?',
            description: 'Describe your task in plain language',
            required: true,
          },
        ],
        next: {
          success: { identifier: 'create-task-{{RECOMMENDED_SERVICE.service_id}}' },
          error:   `${BASE_URL}/marketplace?error=discovery_failed`,
        },
      } satisfies WarpPromptAction,
    ],
  };
}
