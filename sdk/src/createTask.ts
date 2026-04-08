/**
 * AgentBazaar SDK — Create Task (Escrow)
 * Consumer agent locks EGLD into escrow for a specific service task.
 */

import { DEVNET, loadDevnetConfig, explorerTx } from "./devnet";

export interface CreateTaskParams {
  taskId:      string;
  serviceId:   string;
  inputData:   string;   // JSON string or IPFS CID of task input
  paymentEgld: bigint;   // must match service price_per_unit
}

/**
 * Encode createTask call for Escrow contract.
 * Returns data field string ready for signing.
 */
export function encodeCreateTask(params: CreateTaskParams): string {
  const args = [
    toHex(params.taskId),
    toHex(params.serviceId),
    toHex(params.inputData),
  ];
  return `createTask@${args.join("@")}`;
}

/**
 * Encode releaseEscrow call (provider submits proof).
 */
export function encodeReleaseEscrow(taskId: string, resultHash: string): string {
  return `releaseEscrow@${toHex(taskId)}@${toHex(resultHash)}`;
}

/**
 * Encode refundTask call (consumer triggers after timeout).
 */
export function encodeRefundTask(taskId: string): string {
  return `refundTask@${toHex(taskId)}`;
}

/**
 * Encode openDispute call.
 */
export function encodeOpenDispute(taskId: string, reason: string): string {
  return `openDispute@${toHex(taskId)}@${toHex(reason)}`;
}

function toHex(s: string): string {
  return Buffer.from(s).toString("hex");
}

/**
 * Log task creation details for devnet debugging.
 */
export function logTaskCreation(params: CreateTaskParams, registryAddr: string, escrowAddr: string): void {
  const config = loadDevnetConfig();
  console.log("\n📦 AgentBazaar Task Creation");
  console.log(`   Task ID     : ${params.taskId}`);
  console.log(`   Service     : ${params.serviceId}`);
  console.log(`   Payment     : ${Number(params.paymentEgld) / 1e18} EGLD`);
  console.log(`   Registry    : ${DEVNET.EXPLORER}/accounts/${registryAddr}`);
  console.log(`   Escrow      : ${DEVNET.EXPLORER}/accounts/${escrowAddr}`);
  console.log(`   Data        : ${encodeCreateTask(params).substring(0, 60)}...`);
}
