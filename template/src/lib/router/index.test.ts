import { type Handler, Hono } from "hono";
import { type FileSystemModule, toSSG } from "hono/ssg";
import { describe, expect, it } from "vitest";
import { type RouteModule, registerRoutes } from ".";

const text =
	(body: string): Handler =>
	(c) =>
		c.text(body);

const createApp = (modules: Record<string, RouteModule>) => {
	const app = new Hono();
	registerRoutes(app, modules);
	return app;
};

/** toSSG が書き出したファイルのパスを集める */
const ssgFiles = async (app: Hono) => {
	const files: string[] = [];
	const fs: FileSystemModule = {
		writeFile: async (path) => {
			files.push(path);
		},
		mkdir: async () => undefined,
	};
	const result = await toSSG(app, fs, { dir: "out" });
	if (!result.success) throw result.error;
	return files.sort();
};

describe("registerRoutes", () => {
	it("export したメソッドのハンドラーを登録する", async () => {
		const app = createApp({
			"./routes/items/index.ts": { GET: text("get"), POST: text("post") },
		});
		expect(await (await app.request("/items")).text()).toBe("get");
		const res = await app.request("/items", { method: "POST" });
		expect(await res.text()).toBe("post");
		expect((await app.request("/items", { method: "PUT" })).status).toBe(404);
	});

	it("固定 → パラメータ → catch-all の順に優先する", async () => {
		const app = createApp({
			"./routes/a/[...rest]/index.ts": { GET: text("rest") },
			"./routes/a/[id]/index.ts": { GET: text("id") },
			"./routes/a/new/index.ts": { GET: text("new") },
		});
		expect(await (await app.request("/a/new")).text()).toBe("new");
		expect(await (await app.request("/a/1")).text()).toBe("id");
		expect(await (await app.request("/a/1/2")).text()).toBe("rest");
	});

	it("同じ URL にマッチするルートはエラーにする", () => {
		expect(() =>
			createApp({
				"./routes/a/[id]/index.ts": { GET: text("id") },
				"./routes/a/[slug]/index.tsx": { GET: text("slug") },
			}),
		).toThrow(/ルートが衝突しています/);
	});

	it("動的ルートで ssg を使うのに ssgParams がないとエラーにする", () => {
		expect(() =>
			createApp({ "./routes/a/[id]/index.ts": { GET: text("id"), ssg: true } }),
		).toThrow(/ssgParams が必要です/);
	});
});

describe("SSG", () => {
	it("ssg を export したルートだけを書き出す", async () => {
		const app = createApp({
			"./routes/index.ts": { GET: text("top"), ssg: true },
			"./routes/about/index.ts": { GET: text("about") },
			"./routes/posts/[id]/index.ts": {
				GET: text("post"),
				ssg: true,
				ssgParams: async () => [{ id: "1" }, { id: "2" }],
			},
		});
		expect(await ssgFiles(app)).toEqual([
			"out/index.txt",
			"out/posts/1.txt",
			"out/posts/2.txt",
		]);
	});
});
