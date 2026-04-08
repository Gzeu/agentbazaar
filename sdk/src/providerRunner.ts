import crypto from "crypto";
import { ProviderAgentOptions, TaskRequest, TaskResult } from "./types";

export class ProviderAgentRunner {
  readonly providerAddress: string;
  readonly service = this.options.service;

  constructor(private readonly options: ProviderAgentOptions) {
    this.providerAddress = options.providerAddress;
  }

  async handleTask(task: TaskRequest): Promise<TaskResult> {
    const taskId = task.taskId ?? crypto.createHash("sha256").update(JSON.stringify(task)).digest("hex");
    return this.options.execute({ ...task, taskId, provider: this.providerAddress });
  }
}
