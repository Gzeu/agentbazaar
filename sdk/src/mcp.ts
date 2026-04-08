import crypto from "crypto";
import { MCPExecutionRequest, MCPExecutionResponse } from "./types";

export type MCPToolRegistry = Record<
  string,
  (args?: Record<string, unknown>, context?: Record<string, unknown>) => Promise<Record<string, unknown>>
>;

export async function executeMCPRequest(
  request: MCPExecutionRequest,
  tools: MCPToolRegistry,
): Promise<MCPExecutionResponse> {
  try {
    const outputs: Array<Record<string, unknown>> = [];

    for (const call of request.toolCalls) {
      const tool = tools[call.tool];
      if (!tool) {
        throw new Error(`Missing MCP tool: ${call.tool}`);
      }

      const result = await tool(call.args, request.context);
      outputs.push({ tool: call.tool, ...result });
    }

    const proofHash = crypto
      .createHash("sha256")
      .update(JSON.stringify({ taskId: request.taskId, outputs }))
      .digest("hex");

    return {
      taskId: request.taskId,
      success: true,
      outputs,
      proofHash,
    };
  } catch (error) {
    return {
      taskId: request.taskId,
      success: false,
      outputs: [],
      error: error instanceof Error ? error.message : "Unknown MCP execution error",
    };
  }
}
