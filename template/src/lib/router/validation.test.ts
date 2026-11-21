import { type Handler, Hono } from "hono";
import { describe, expect, it } from "vitest";
import { type RouteModule, registerRoutes } from ".";

const handler: Handler = (c) => c.text("ok");
const register = (modules: Record<string, RouteModule>) =>
	registerRoutes(new Hono(), modules);

describe("registerRoutes の検証", () => {
	it("ハンドラーを export していないファイルはエラーにする", () => {
		expect(() =>
			register({ "./routes/components/index.ts": {} as RouteModule }),
		).toThrow(/components\/index\.ts: ハンドラー/);
	});

	it("小文字などで書いたメソッド名はエラーにする", () => {
		expect(() =>
			register({
				"./routes/index.ts": { Get: handler } as unknown as RouteModule,
			}),
		).toThrow(/"GET" で export/);
	});

	it("ssg で GET がないとエラーにする", () => {
		expect(() =>
			register({ "./routes/index.ts": { POST: handler, ssg: true } }),
		).toThrow(/ssg を使うには GET/);
	});

	it("ハンドラー以外の export があっても登録できる", async () => {
		const app = new Hono();
		registerRoutes(app, {
			"./routes/index.ts": { GET: handler, helper: 1 } as RouteModule,
		});
		expect(await (await app.request("/")).text()).toBe("ok");
	});
});
