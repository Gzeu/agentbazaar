import crypto from "crypto";
import { ConsumerAgentOptions, QuoteResponse, TaskRequest } from "./types";

export class ConsumerAgentRunner {
  readonly buyerAddress: string;
  readonly defaultCurrency: string;

  constructor(options: ConsumerAgentOptions) {
    this.buyerAddress = options.buyerAddress;
    this.defaultCurrency = options.defaultCurrency ?? "USDC";
  }

  createTaskFromQuote(quote: QuoteResponse, input: unknown): TaskRequest {
    return {
      taskId: crypto.createHash("sha256").update(`${quote.quoteId}:${Date.now()}`).digest("hex"),
      serviceId: quote.serviceId,
      buyer: this.buyerAddress,
      provider: quote.provider,
      quoteId: quote.quoteId,
      input,
      paymentMethod: quote.settlementMethod,
      amount: quote.price,
      currency: quote.currency ?? this.defaultCurrency,
    };
  }
}
