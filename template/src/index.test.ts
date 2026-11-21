import { describe, expect, it } from "vitest";
import app from "./index";

describe("app", () => {
	it("トップページに記事の一覧を表示する", async () => {
		const res = await app.request("/");
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toMatch(/<title>Blog<\/title>/);
		expect(html).toMatch(/href="\/posts\/1"/);
	});

	it("記事ページを表示し、存在しない記事は 404 にする", async () => {
		expect(await (await app.request("/posts/1")).text()).toMatch(
			/Hono を始める/,
		);
		expect((await app.request("/posts/999")).status).toBe(404);
	});

	it("カテゴリは下の階層の記事も表示する", async () => {
		const tech = await (await app.request("/categories/tech")).text();
		expect(tech).toMatch(/Hono を始める/);
		expect(tech).toMatch(/Cloudflare Workers/);
		const web = await (await app.request("/categories/tech/web")).text();
		expect(web).not.toMatch(/Cloudflare Workers/);
		expect((await app.request("/categories/none")).status).toBe(404);
	});

	it("API は JSON を返す", async () => {
		const res = await app.request("/api/health");
		expect(await res.json()).toEqual({ status: "ok" });
	});

	it("末尾スラッシュはスラッシュなしへリダイレクトする", async () => {
		const res = await app.request("/posts/1/");
		expect(res.status).toBe(301);
		expect(new URL(res.headers.get("Location") ?? "").pathname).toBe(
			"/posts/1",
		);
	});

	it("存在しないページは 404 ページを返す", async () => {
		const res = await app.request("/no/such/page");
		expect(res.status).toBe(404);
		expect(await res.text()).toMatch(/404 Not Found/);
	});
});
