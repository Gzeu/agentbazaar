import { describe, it, expect, afterEach, vi } from "vitest";
import { tasksApi, servicesApi, reputationApi, analyticsApi } from "./api";

const jsonRes = (body: unknown, ok = true, status = 200) =>
  ({ ok, status, json: async () => body }) as Response;

const mockFetch = (impl: (url: string, init?: RequestInit) => Response) => {
  vi.stubGlobal("fetch", vi.fn(async (url: any, init?: any) => impl(url, init)));
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("tasksApi", () => {
  it("disputes a task with reason", async () => {
    const fake = { id: "t1", status: "disputed" };
    let captured: RequestInit | undefined;
    mockFetch((_url, init) => {
      captured = init;
      return jsonRes(fake);
    });
    const res = await tasksApi.dispute("t1", "no deliver");
    expect(res).toEqual(fake);
    expect(captured?.method).toBe("POST");
    expect(JSON.parse(String(captured?.body))).toEqual({ reason: "no deliver" });
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain("/tasks/t1/dispute");
  });

  it("throws with server message on failure", async () => {
    mockFetch(() => jsonRes({ message: "Cannot refund" }, false, 400));
    await expect(tasksApi.refund("t1")).rejects.toThrow("Cannot refund");
  });
});

describe("servicesApi", () => {
  it("registers a service", async () => {
    const fake = { id: "svc-1" };
    let captured: RequestInit | undefined;
    mockFetch((_u, init) => {
      captured = init;
      return jsonRes(fake);
    });
      const res = await servicesApi.register({
      name: "Oracle", category: "data", providerAddress: "erd1x", endpoint: "https://e",
      priceAmount: "0.01",
    });
    expect(res).toEqual(fake);
    expect(JSON.parse(String(captured?.body))).toMatchObject({ name: "Oracle" });
  });
});

describe("analyticsApi", () => {
  it("fetches volume with days param", async () => {
    mockFetch(() => jsonRes({ days: 7, series: [] }));
    await analyticsApi.volume(7);
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain("/analytics/volume?days=7");
  });
});

describe("reputationApi", () => {
  it("fetches leaderboard", async () => {
    mockFetch(() => jsonRes([]));
    await reputationApi.leaderboard(5);
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain("/reputation?limit=5");
  });
});

describe("servicesApi.deregister", () => {
  it("sends DELETE to service id and returns success", async () => {
    let captured: RequestInit | undefined;
    let calledUrl = "";
    const fake = { success: true };
    mockFetch((url, init) => {
      calledUrl = String(url);
      captured = init;
      return jsonRes(fake);
    });
    const res = await servicesApi.deregister("svc-42");
    expect(res).toEqual(fake);
    expect(captured?.method).toBe("DELETE");
    expect(calledUrl).toContain("/services/svc-42");
  });
});
