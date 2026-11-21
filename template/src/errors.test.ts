import { HTTPException } from "hono/http-exception";
import { afterEach, describe, expect, it, vi } from "vitest";
import app from "./index";

// エラー処理を確かめるため、テスト用のルートを追加する
app.get("/api/test/throw", () => {
	throw new Error("boom");
});
app.get("/api/test/forbidden", () => {
	throw new HTTPException(403, { message: "Forbidden" });
});
app.get("/test/throw", () => {
	throw new Error("boom");
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("API のエラー", () => {
	it("存在しない API は JSON の 404 を返す", async () => {
		const res = await app.request("/api/no-such-api");
		expect(res.status).toBe(404);
		expect(await res.json()).toEqual({ error: "Not Found" });
	});

	it("例外は詳細を隠した JSON の 500 を返す", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		const res = await app.request("/api/test/throw");
		expect(res.status).toBe(500);
		expect(await res.json()).toEqual({ error: "Internal Server Error" });
		expect(console.error).toHaveBeenCalled();
	});

	it("HTTPException はそのステータスとメッセージで返す", async () => {
		const res = await app.request("/api/test/forbidden");
		expect(res.status).toBe(403);
		expect(await res.json()).toEqual({ error: "Forbidden" });
	});
});

describe("ページのエラー", () => {
	it("存在しないページは HTML の 404 を返す", async () => {
		const res = await app.request("/no-such-page");
		expect(res.status).toBe(404);
		expect(res.headers.get("Content-Type")).toMatch(/text\/html/);
	});

	it("例外は HTML の 500 を返す", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		const res = await app.request("/test/throw");
		expect(res.status).toBe(500);
		expect(await res.text()).toMatch(/500 Internal Server Error/);
	});

	it("/api で始まるだけのページは API として扱わない", async () => {
		const res = await app.request("/apix");
		expect(res.headers.get("Content-Type")).toMatch(/text\/html/);
	});
});
