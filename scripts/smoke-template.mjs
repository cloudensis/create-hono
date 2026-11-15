// CI 用: `npm run build` 済みのプロジェクトの成果物を検証する
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { it } from "node:test";
import { pathToFileURL } from "node:url";

const output = path.resolve(
	process.argv[2],
	".cloudflare/output/v0/workers/default",
);
const { default: app } = await import(
	pathToFileURL(path.join(output, "bundle/index.js")).href
);

const body = async (url) => (await app.request(url)).text();
const status = async (url) => (await app.request(url)).status;

it("ssg のルートだけを書き出す", async () => {
	const assets = path.join(output, "assets");
	assert.ok((await fs.readdir(assets)).includes("index.html"));
	const posts = await fs.readdir(path.join(assets, "posts"));
	assert.deepEqual(posts.sort(), ["1.html", "2.html", "3.html"]);
	assert.ok(!(await fs.readdir(assets)).includes("categories"));
});

it("ページを返す", async () => {
	assert.match(await body("/"), /Hono を始める/);
	assert.match(await body("/posts/1"), /Hono を始める/);
	assert.equal(await status("/posts/999"), 404);
});

it("catch-all はカテゴリの階層にマッチする", async () => {
	const tech = await body("/categories/tech");
	assert.match(tech, /Hono を始める/);
	assert.match(tech, /Cloudflare Workers/);
	const web = await body("/categories/tech/web");
	assert.match(web, /Hono を始める/);
	assert.doesNotMatch(web, /Cloudflare Workers/);
	assert.equal(await status("/categories/none"), 404);
});

it("API は JSON を返す", async () => {
	assert.deepEqual(await (await app.request("/api/health")).json(), {
		status: "ok",
	});
});

it("末尾スラッシュはスラッシュなしへリダイレクトする", async () => {
	const res = await app.request("/posts/1/");
	assert.equal(res.status, 301);
	assert.equal(new URL(res.headers.get("Location")).pathname, "/posts/1");
});

it("存在しないパスは 404 を返す", async () => {
	assert.equal(await status("/no/such/page"), 404);
});
