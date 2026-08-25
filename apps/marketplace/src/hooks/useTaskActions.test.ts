import { describe, it, expect, vi } from "vitest";

// Test the pure state-machine logic used by useTaskActions by exercising the
// API layer it depends on (see api.test.ts). Here we assert the exported
// hooks are present and that the module loads cleanly.
import {
  useDispute,
  useRefund,
  useComplete,
} from "./useTaskActions";

describe("useTaskActions", () => {
  it("exports the three hooks with their action fns", () => {
    expect(typeof useDispute).toBe("function");
    expect(typeof useRefund).toBe("function");
    expect(typeof useComplete).toBe("function");
  });
});
